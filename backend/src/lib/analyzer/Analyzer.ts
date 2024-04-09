import { InputType, UnifiedInput } from '../../types/UnifiedInput'
import { Stock, StockChangeData } from '../Stock'
import { DateTime } from 'luxon'
import { buy } from './buy'
import { AccountCode, Transaction } from '../../types/Transaction'
import Decimal from 'decimal.js'
import { Timestring } from '@tasenor/common'

// TODO: Plan and embed the rule-based steps here or elsewhere.

export type AnalyzeHandler = (analyzer: Analyzer, time: DateTime, input: UnifiedInput) => Promise<Transaction>

function notImplemented(type): AnalyzeHandler {
  return  () => {
    throw new Error(`Handler function not implemented for type ${JSON.stringify(type)}.`)
  }
}

/**
 * Running balances of accounts.
 */
export type Balances = Partial<Record<AccountCode, Decimal>>

/**
 * Core engine for tracking and calculating transactions from unified items.
 */
export class Analyzer {
  private stock: Stock
  private balances: Balances

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
  }

  /**
   * Analyze an unified input and convert it to the transactions.
   * @param time
   * @param input
   * @returns
   */
  async analyze(time: DateTime, input: UnifiedInput): Promise<Transaction> {
    const tx = await Analyzer.handlers[input.type](this, time, input)
    return tx
  }

  /**
   * Update stock and balances according to the transaction.
   * @param tx
   */
  apply(tx: Transaction) {
    console.log('TODO: apply', tx)
    // TODO: Sanity check that total is zero.
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
