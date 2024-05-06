import prisma from '@prisma/client'
import { Stock, InitialStockData, StockData } from '../Stock'
import { DateTime } from 'luxon'
import Decimal from 'decimal.js'
import { Asset, Currency, Language, Timestring, warning } from '@tasenor/common'
import { JsonValue } from '@prisma/client/runtime/library'
import { dec, toJSON } from '../utils'
import { changeLanguage, initI18N } from '../i18n/t'
import { validateBasics, validateError, validateInput, validateRate, validateRequiredField, validateRequired, validateText, validateValue, validateValueOrAsset, validateNotEmpty, validateFee, validateValueAccount, validateAssetOutAccount, validateAssetInAccount } from './validators'
import { AnalyzerConfig } from './AnalyzerConfig'
import { buy } from './handlers/buy'
import { deposit } from './handlers/deposit'
import { expense } from './handlers/expense'
import { forex } from './handlers/forex'
import { income } from './handlers/income'
import { sell } from './handlers/sell'
import { withdrawal } from './handlers/withdrawal'
import { AccountCode } from '../../types/AccountCode'
import { Transaction } from '../../types/API/Transaction'
import { UnifiedItemData } from '../../types/API/UnifiedItemData'
import { Service, ServiceAnswer, ServiceQuery } from '../services/Service'

/**
 * Running balances for accounts.
 */
export type Balances = Partial<Record<AccountCode, Decimal>>

/**
 * Core engine for tracking and calculating transactions from unified items.
 */
export class Analyzer {
  private static  config: AnalyzerConfig | null

  private services: Record<prisma.ServiceType, Service[]>

  protected stock: Stock
  protected balances: Balances
  protected clock: Timestring
  protected lastInput: UnifiedItemData | null
  protected lastTime: Timestring
  protected lastResult: Transaction | null

  // Bind handlers.
  public buyHandler = buy.bind(this)
  public sellHandler = sell.bind(this)
  public expenseHandler = expense.bind(this)
  public depositHandler = deposit.bind(this)
  public incomeHandler = income.bind(this)
  public withdrawalHandler = withdrawal.bind(this)
  public forexHandler = forex.bind(this)

  // Bind validators.
  public validateError: (msg: string) => never = validateError.bind(this)
  public validateInput: () => UnifiedItemData = validateInput.bind(this)
  public validateBasics: () => void = validateBasics.bind(this)
  public validateRequiredField: (field: keyof UnifiedItemData) => void = validateRequiredField.bind(this)
  public validateRequired: (...fields: Array<keyof UnifiedItemData>) => void = validateRequired.bind(this)
  public validateText: (text: string, values: Record<string, string | undefined>) => string = validateText.bind(this)
  public validateRate: (asset: Asset, canUseService: boolean) => Promise<Decimal> = validateRate.bind(this)
  public validateValue: (canUseService: boolean) => Promise<Decimal> = validateValue.bind(this)
  public validateValueOrAsset: (asset: Asset | undefined, amount: number | Decimal | undefined, canUseService: boolean) => Promise<Decimal> = validateValueOrAsset.bind(this)
  public validateNotEmpty: (field: keyof UnifiedItemData) => void = validateNotEmpty.bind(this)
  public validateFee: (this: Analyzer, canUseService: boolean) => Promise<[Decimal, Asset | null, Decimal | null]> = validateFee.bind(this)
  public validateValueAccount: (this: Analyzer, withService: boolean) => AccountCode = validateValueAccount.bind(this)
  public validateAssetOutAccount: (this: Analyzer, withService: boolean) => AccountCode = validateAssetOutAccount.bind(this)
  public validateAssetInAccount: (this: Analyzer, withService: boolean) => AccountCode = validateAssetInAccount.bind(this)

  /**
   * Initialize
   * @param stock
   */
  constructor(stock: Stock, balances: Balances = {}) {
    this.services = {
      CRYPTO_RATES: [],
      CURRENCY_RATES: []
    }
    this.stock = stock
    this.balances = balances
    this.clock = '0000-00-00T00:00:00Z' as Timestring
    this.lastInput = null
    this.lastTime = '0000-00-00T00:00:00Z' as Timestring
    this.lastResult = null
  }

  get currency(): Currency {
    return Analyzer.getConfig('currency') as Currency
  }
  get language(): Language {
    return Analyzer.getConfig('language') as Language
  }

  /**
   * Set services available.
   * @param services
   */
  setServices(services: Service[]): void {
    Object.keys(this.services).forEach(cabapility => {
      this.services[cabapility] = []
    })
    services.forEach(service => {
      service.getCababilities().forEach(cabapility => {
        this.services[cabapility].push(service)
      })
    })
  }

  /**
   * Run the service query.
   * @param query
   */
  async askService(query: ServiceQuery): Promise<ServiceAnswer> {
    for (const service of this.services[query.query]) {
      const result = await service.query(query)
      if (result !== null) {
        return result
      }
      warning(`A service ${service.constructor.name} was not able to handle query ${JSON.stringify(query)}`)
    }
    throw new Error(`There is no service available to handle query ${JSON.stringify(query)}`)
  }

  /**
   * Check that configuration is set and throw error if not.
   * @param variable
   * @returns Value from configuration.
   */
  static getConfig<T>(variable: keyof AnalyzerConfig): T {
    if (!Analyzer.config) {
      throw new Error(`Cannot get '${variable}' from analyzer, since configuration not set.`)
    }
    return Analyzer.config[variable] as T
  }

  /**
   * Analyze an unified input and convert it to the transactions.
   * @param time
   * @param input
   * @returns
   */
  async analyze(time: DateTime, input: UnifiedItemData): Promise<Transaction> {
    await initI18N()
    await changeLanguage(this.language) // TODO: Not needed here. Always explicit.
    this.lastInput = input
    this.lastTime = time.toISO() as Timestring
    if (!this[`${input.type}Handler`]) {
      throw new Error(`Analyzer does not yet implement input type '${input.type}'.`)
    }
    this.lastResult = await this[`${input.type}Handler`](time, input)
    if (!this.lastResult) {
      throw new Error(`A function ${input.type} failed to produce the result.`)
    }
    return this.lastResult
  }

  /**
   * Change the balance for an account.
   * @param account
   * @param amount
   */
  addBalance(account: AccountCode, amount: Decimal): void {
    if (!(account in this.balances)) {
      this.balances[account] = new Decimal(0)
    }
    this.balances[account] = this.balances[account]?.plus(amount)
  }

  /**
   * Update stock.
   * @param asset
   * @param amount
   * @param value
   */
  addAsset(account: AccountCode, asset: Asset, amount: Decimal, value: Decimal): void {
    this.stock.addAsset(account, asset, amount, value)
  }

  /**
   * Update stock and balances according to the transaction.
   * @param tx
   */
  apply(tx: Transaction) {
    // Timestamp must be applied in order.
    if (tx.time < this.clock) {
      throw new Error(`Trying to apply past transaction when the clock is ${this.clock}: ${JSON.stringify(tx)}`)
    }
    this.clock = tx.time as Timestring

    // Sanity check that total is zero.
    let sum = new Decimal(0)
    tx.lines.forEach((line) => sum = sum.plus(line.amount))
    if (!sum.isZero()) {
      throw new Error(`Total ${sum} of the transaction is not zero: ${JSON.stringify(tx)}`)
    }

    // Apply balance changes.
    tx.lines.forEach((line) => this.addBalance(line.account as AccountCode, dec(line.amount)))

    // Apply asset changes.
    tx.lines.forEach((line) => line.extras.asset &&
      line.extras.assetChange &&
      this.addAsset(line.account as AccountCode, line.extras.asset as Asset, dec(line.extras.assetChange), dec(line.amount))
    )
  }

  /**
   * Calculate stock change information for transaction.
   * @param tx
   */
  getStockChange(tx: Transaction): Record<AccountCode, StockData> {
    return this.stock.getStockChange(tx)
  }

  /**
   * Summarize state of the analyzer.
   * @returns Last transaction, stock and balances.
   */
  toJSON(): JsonValue {
    return {
      tx: toJSON(this.lastResult),
      balances: toJSON(this.balances),
      stock: this.stock.toJSON()
    }
  }

  /**
   * Set configuration for analyzers.
   */
  static configure(config: AnalyzerConfig) {
    for (const c of ['language', 'currency']) {
      if (config[c] === undefined) {
        throw new Error(`A required configuration variable '${c}' is missing in ${JSON.stringify(config)}.`)
      }
    }
    Analyzer.config = config
  }

  /**
   * Create analyzer and execute one analysis (for easier unit testing).
   * @param stockData
   * @param input
   * @returns
   */
  static async run(time: Timestring, stockData: InitialStockData, input: UnifiedItemData, services: undefined | Service[] = undefined): Promise<Analyzer> {
    const stock = new Stock(stockData)
    const analyzer = new Analyzer(stock)

    if (services !== undefined) {
      analyzer.setServices(services)
    }

    const tx = await analyzer.analyze(DateTime.fromISO(time), input)
    analyzer.apply(tx)

    return analyzer
  }
}
