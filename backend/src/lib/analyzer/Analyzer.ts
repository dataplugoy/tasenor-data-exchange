/* eslint-disable no-use-before-define */
import prisma from '@prisma/client'
import clone from 'clone'
import { JsonValue } from '@prisma/client/runtime/library'
import { Asset, Currency, Language, Timestring, warning } from '@tasenor/common'
import Decimal from 'decimal.js'
import { DateTime } from 'luxon'
import { ProjectSettings } from '../../types/API/Project'
import { Transaction } from '../../types/API/Transaction'
import { UnifiedItemData } from '../../types/API/UnifiedItemData'
import { AccountCode } from '../../types/AccountCode'
import { Balance } from '../Balance'
import { InitialStockData, Stock, StockDataRecord } from '../Stock'
import { initI18N } from '../i18n/t'
import { Service, ServiceAnswer, ServiceQuery } from '../services/Service'
import { dec, toJSON } from '../utils'
import { buy } from './handlers/buy'
import { deposit } from './handlers/deposit'
import { expense } from './handlers/expense'
import { forex } from './handlers/forex'
import { income } from './handlers/income'
import { rename } from './handlers/rename'
import { sell } from './handlers/sell'
import { split } from './handlers/split'
import { withdrawal } from './handlers/withdrawal'
import { validateAsset, validateAssetInAccount, validateAssetOutAccount, validateBasics, validateError, validateFee, validateInput, validateNotEmpty, validateRate, validateRequired, validateRequiredField, validateText, validateValue, validateValueAccount, validateValueOrAsset } from './validators'
import { Setup } from '../../types/API/Setup'
import { resolveAccount } from './resolver'
import { RuntimeOptions } from '../../types/RuntimeOptions'
import { AnswersRequired } from '../../exceptions/AnswersRequired'
import { FlowPlanModel } from '../../models/FlowPlanModel'

/**
 * Core engine for tracking and calculating transactions from unified items.
 */
export class Analyzer {

  private services: Record<prisma.ServiceType, Service[]>

  protected stock: Stock
  protected balance: Balance
  protected clock: Timestring
  protected lastInput: UnifiedItemData | null
  protected lastTime: Timestring
  protected lastResult: Transaction | null
  protected readonly config: ProjectSettings
  protected readonly setup: Setup
  protected readonly runtimeOptions: RuntimeOptions

  // Bind handlers.
  public buyHandler = buy.bind(this)
  public sellHandler = sell.bind(this)
  public expenseHandler = expense.bind(this)
  public depositHandler = deposit.bind(this)
  public incomeHandler = income.bind(this)
  public withdrawalHandler = withdrawal.bind(this)
  public forexHandler = forex.bind(this)
  public renameHandler = rename.bind(this)
  public splitHandler = split.bind(this)

  // Bind validators.
  public validateError: (msg: string) => never = validateError.bind(this)
  public validateInput: () => UnifiedItemData = validateInput.bind(this)
  public validateBasics: () => void = validateBasics.bind(this)
  public validateRequiredField: (field: keyof UnifiedItemData) => void = validateRequiredField.bind(this)
  public validateRequired: (...fields: Array<keyof UnifiedItemData>) => void = validateRequired.bind(this)
  public validateText: (text: string, values: Record<string, string | undefined>) => string = validateText.bind(this)
  public validateRate: (asset: Asset, canUseService: boolean) => Promise<Decimal> = validateRate.bind(this)
  public validateValue: (canUseService: boolean) => Promise<Decimal> = validateValue.bind(this)
  public validateAsset: (asset: Asset | undefined, amount: number | Decimal | undefined, canUseService: boolean) => Promise<Decimal> = validateAsset.bind(this)
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
  constructor(config: ProjectSettings, stock: Stock, balances: Balance | {}, setup: Setup = {}, runtimeOptions: RuntimeOptions = { userId: 0 }) {
    this.services = {
      CRYPTO_RATES: [],
      CURRENCY_RATES: []
    }
    this.stock = stock
    this.balance = balances instanceof Balance ? balances : new Balance(balances)
    this.clock = '0000-00-00T00:00:00Z' as Timestring
    this.lastInput = null
    this.lastTime = '0000-00-00T00:00:00Z' as Timestring
    this.lastResult = null
    this.setup = setup
    this.runtimeOptions = runtimeOptions
    for (const c of ['language', 'currency']) {
      if (config[c] === undefined) {
        throw new Error(`A required configuration variable '${c}' is missing in ${JSON.stringify(config)}.`)
      }
    }
    this.config = config
  }

  get currency(): Currency {
    return this.config.currency as Currency
  }

  get language(): Language {
    return this.config.language as Language
  }

  /**
   * Check if the variable is set and return it. If not, throw a answer request.
   * @param variable
   */
  async getSetting(variable: string) {
    const settings = this.setup.settings || {}

    if (variable in settings && settings[variable] !== undefined) {
      return settings[variable]
    }

    AnswersRequired.throw(`/flow-plans/${this.runtimeOptions.flowPlanId}/configure`, this.config.language as Language, this.runtimeOptions.userId, variable)
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
   * Analyze an unified input and convert it to the transactions.
   * @param time
   * @param input
   * @returns
   */
  async analyze(time: DateTime, input: UnifiedItemData): Promise<Transaction> {
    await initI18N()
    this.lastInput = input
    this.lastTime = time.toISO() as Timestring
    if (!this[`${input.type}Handler`]) {
      throw new Error(`Analyzer does not yet implement input type '${input.type}'.`)
    }

    // Create the result.
    this.lastResult = await this[`${input.type}Handler`](time, input)
    this.lastResult && this.resolveAccounts(this.lastResult)
    if (input.tags) {
      this.lastResult?.lines.forEach(line => {
        if (!line.extras) {
          line.extras = {}
        }
        line.extras.tags = clone(input.tags)
      })
    }

    // Check for debt in currency accounts.
    for (const line of this.lastResult?.lines || []) {
      if (/^CURRENCY_/.test(line.account)) {
        const balance = this.balance.getBalance(line.account as AccountCode)
        if (balance.add(line.amount).lt(0)) {
          const debtAccount_real = await this.getDebtAccount(line.account.substring(9) as Currency)
          const debtAccount = '999' // TODO: Drop debug.
          if (debtAccount === null) {
            continue
          }
          console.log(balance)
          console.log(line)
          throw new Error('PAY YOUR DEBT')
        }
      }
    }

    if (!this.lastResult) {
      throw new Error(`A function ${input.type} failed to produce the result.`)
    }

    return this.lastResult
  }

  /**
   * Apply account naming rules from setup.
   */
  resolveAccounts(tx: Transaction): void {
    tx.lines.forEach(line => {
      if (line.account.startsWith('ACCOUNT_')) {
        line.account = line.account.substring(8)
      } else {
        line.account = this.resolveAccount(line.account)
      }
    })
  }

  /**
   * Get the configured account code for a raw proposal.
   * @param proposal
   */
  resolveAccount(proposal: string): AccountCode {
    return resolveAccount(this.setup, proposal as AccountCode)
  }

  /**
   * Update stock.
   * @param asset
   * @param amount
   * @param value
   */
  addAsset(account: AccountCode, asset: Asset, amount: Decimal, value: Decimal): void {
    account = resolveAccount(this.setup, account)
    this.stock.addAsset(account, asset, amount, value)
  }

  /**
   * Add to the balance.
   * @param acc
   * @param value
   */
  addBalance(account: AccountCode, value: number | string | Decimal) {
    account = resolveAccount(this.setup, account)
    this.balance.addBalance(account, value)
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
    tx.lines.forEach((line) => (sum = sum.plus(line.amount)))
    if (!sum.isZero()) {
      throw new Error(`Total ${sum} of the transaction is not zero: ${JSON.stringify(tx)}`)
    }

    // Apply balance changes.
    tx.lines.forEach((line) => this.addBalance(line.account as AccountCode, dec(line.amount)))

    // Apply asset changes.
    tx.lines.forEach((line) => {
      if (line.extras.asset && line.extras.assetChange) {
        this.addAsset(line.account as AccountCode, line.extras.asset as Asset, dec(line.extras.assetChange), dec(line.amount))
      }
    })
  }

  /**
   * Calculate stock change information for transaction.
   * @param tx
   */
  getStockChange(tx: Transaction): Record<AccountCode, StockDataRecord> {
    return this.stock.getStockChange(tx)
  }

  /**
   * Find the corresponding debt account or null if not used. Throw an exception if we don't know.
   * @param currency
   */
  async getDebtAccount(currency: Currency) {
    const plan = await FlowPlanModel.get(this.runtimeOptions.flowPlanId as number)
    if (!plan) {
      throw new Error('Cannot find flow plan.')
    }
    const settings = (plan.data?.setup as Setup).settings || {}
    if (settings.debtAccounts !== null && settings.debtAccounts instanceof Object) {
      if (currency in settings.debtAccounts) {
        return settings.debtAccounts[currency]
      }
    }

    const destination = await plan.getDestination()

    AnswersRequired.forDebt(`/flow-plans/${this.runtimeOptions.flowPlanId}/configure`, this.config.language as Language, this.runtimeOptions.userId, destination.id, currency)
  }

  /**
   * Summarize state of the analyzer.
   * @returns Last transaction, stock and balances.
   */
  toJSON(decimalsToString = false): { tx: JsonValue, balances: JsonValue, stock: JsonValue } {
    return {
      tx: toJSON(this.lastResult),
      balances: this.balance.toJSON(decimalsToString),
      stock: this.stock.toJSON(decimalsToString)
    }
  }

  /**
   * Create analyzer and execute one analysis (for easier unit testing).
   * @param stockData
   * @param input
   * @returns
   */
  static async run(settings: ProjectSettings, time: Timestring, stockData: InitialStockData, input: UnifiedItemData, runtimeOptions: RuntimeOptions = { userId: 0 }, setup: Setup = {}, services: undefined | Service[] = undefined): Promise<Analyzer> {
    const stock = new Stock(stockData)
    const analyzer = new Analyzer(settings, stock, {}, setup, runtimeOptions)

    if (services !== undefined) {
      analyzer.setServices(services)
    }

    const tx = await analyzer.analyze(DateTime.fromISO(time), input)
    analyzer.apply(tx)

    return analyzer
  }
}
