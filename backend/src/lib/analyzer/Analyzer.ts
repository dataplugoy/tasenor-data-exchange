import { InputType, UnifiedInput } from '../../types/UnifiedInput'
import { Stock, StockChangeData } from '../Stock'
import { DateTime } from 'luxon'
import { buy } from './buy'
import { AccountCode, Transaction } from '../../types/Transaction'
import Decimal from 'decimal.js'
import { Asset, Currency, Language, Timestring } from '@tasenor/common'
import { JsonValue } from '@prisma/client/runtime/library'
import { dec, toJSON } from '../utils'
import { changeLanguage, initI18N, t } from '../i18n/t'

// TODO: Plan and embed the rule-based steps here or elsewhere.

export type AnalyzeHandler = (analyzer: Analyzer, time: DateTime, input: UnifiedInput) => Promise<Transaction>

function notImplemented(type): AnalyzeHandler {
  return  () => {
    throw new Error(`Handler function not implemented for type ${JSON.stringify(type)}.`)
  }
}

/**
 * Running balances for accounts.
 */
export type Balances = Partial<Record<AccountCode, Decimal>>

/**
 * Configuration for analyzer.
 */
export type AnalyzerConfig = {
  currency: Currency
  language: Language
}

/**
 * Core engine for tracking and calculating transactions from unified items.
 */
export class Analyzer {
  private static  config: AnalyzerConfig | null

  private stock: Stock
  private balances: Balances
  private clock: Timestring
  private lastInput: UnifiedInput | null
  private lastResult: Transaction | null

  /**
   * Handler functions per type.
   */
  private static handlers: Record<InputType, AnalyzeHandler> = {
    buy,
    dividend: notImplemented('dividend'),
    expense: notImplemented('expense'),
    income: notImplemented('income'),
    sell: notImplemented('sell'),
    trade: notImplemented('trade'),
  }

  /**
   * Initialize
   * @param stock
   */
  constructor(stock: Stock, balances: Balances = {}) {
    this.stock = stock
    this.balances = balances
    this.clock = '0000-00-00T00:00:00Z' as Timestring
    this.lastInput = null
    this.lastResult = null
  }

  get currency(): Currency {
    return Analyzer.getConfig('currency') as Currency
  }
  get language(): Language {
    return Analyzer.getConfig('language') as Language
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
  async analyze(time: DateTime, input: UnifiedInput): Promise<Transaction> {
    await initI18N()
    await changeLanguage(this.language)
    this.lastInput = input
    this.lastResult = await Analyzer.handlers[input.type](this, time, input)
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
  addAsset(asset: Asset, amount: Decimal, value: Decimal): void {
    this.stock.addAsset(asset, amount, value)
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
    this.clock = tx.time

    // Sanity check that total is zero.
    let sum = new Decimal(0)
    tx.lines.forEach((line) => sum = sum.plus(line.amount))
    if (!sum.isZero()) {
      throw new Error(`Total ${sum} of the transaction is not zero: ${JSON.stringify(tx)}`)
    }

    // Apply balance changes.
    tx.lines.forEach((line) => this.addBalance(line.account, line.amount))

    // Apply asset changes.
    tx.lines.forEach((line) => line.extras.asset &&
      line.extras.assetChange &&
      this.stock.addAsset(line.extras.asset, line.extras.assetChange, line.amount)
    )
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
   * Throw a validation error.
   * @param msg
   */
  validateError(msg: string): never {
    throw new Error(`${msg}: ${JSON.stringify(this.lastInput)}`)
  }

  /**
   * Do standard validations for input.
   */
  validateBasics(): void {
    if (!this.lastInput) {
      throw new Error('Cannot use validation before setting the last input.')
    }
    if (this.lastInput.value !== undefined && dec(this.lastInput.value).isNegative()) {
      this.validateError(`Total value ${this.lastInput.value} cannot be negative.`)
    }
  }

  /**
   * Ensure the field exist in input.
   * @param field
   */
  validateRequirdeField(field: keyof UnifiedInput): void {
    if (!this.lastInput) {
      throw new Error('Cannot use validation before setting the last input.')
    }
    if (this.lastInput[field] === undefined) {
      this.validateError(`The field '${field}' is required`)
    }
  }

  /**
   * Ensure all fields exist in input.
   * @param fields
   */
  validateRequired(...fields: Array<keyof UnifiedInput>): void {
    fields.forEach(field => this.validateRequirdeField(field))
  }

  /**
   * Use either explicit text or translate the given text.
   * @param text
   */
  validateText(text: string, values: Record<string, string | undefined> = {}): string {
    if (!this.lastInput) {
      throw new Error('Cannot use validation before setting the last input.')
    }
    if (this.lastInput.text !== undefined) {
      return this.lastInput.text
    }
    Object.keys(values).forEach(k => {
      if (values[k] === undefined) {
        this.validateError(`A value for key '${k}' is undefined.`)
      }
    })
    return t(text, values as Record<string, string>)
  }

  /**
   * Set configuration for analyzers.
   */
  static configure(config: AnalyzerConfig) {
    Analyzer.config = config
    // TODO: Validate critical stuff like currency and language.
  }

  /**
   * Create analyzer and execute one analysis (for easier unit testing).
   * @param stockData
   * @param input
   * @returns
   */
  static async run(time: Timestring, stockData: StockChangeData, input: UnifiedInput): Promise<Analyzer> {
    const stock = new Stock(stockData)
    const analyzer = new Analyzer(stock)
    const tx = await analyzer.analyze(DateTime.fromISO(time), input)
    analyzer.apply(tx)

    return analyzer
  }
}
