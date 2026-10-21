/**
 * Helpers for the opening balances and assets of a flow plan, proposed by the drivers before its first batch.
 */
import Decimal from 'decimal.js'
import { Asset, Currency } from '@tasenor/common'
import { OpeningState } from '../types/API/OpeningState'
import { BalanceData } from '../types/API/BalanceData'
import { Setup } from '../types/API/Setup'
import { AccountCode } from '../types/AccountCode'
import { resolveAccount } from './analyzer/resolver'
import { dec } from './utils'

/**
 * Round to cents.
 */
const toCents = (value: Decimal): number => value.toDecimalPlaces(2).toNumber()

/**
 * Find the value of one unit of a currency in the currency of the project on the given date, or null if not known.
 */
export type RateFunction = (currency: Currency, date: string) => Promise<Decimal | null>

/**
 * Create an empty opening state.
 */
export function emptyOpeningState(date: string, source: string): OpeningState {
  return { date, sources: [source], notes: [], balance: {}, stock: {} }
}

/**
 * Check if the opening state has any values.
 */
export function hasOpeningValues(state: OpeningState): boolean {
  return Object.keys(state.balance).length > 0 || Object.keys(state.stock).length > 0
}

/**
 * Find the account code the analyzer keeps the stock of an asset in.
 * @param setup
 * @param type Type of the asset like `STOCK`.
 * @param name Name of the asset in the data, replaced by the configured ticker if there is one.
 * @returns Account code and the asset.
 */
export function stockAccount(setup: Setup, type: string, name: string): [AccountCode, Asset] {
  const ticker = (setup.tickers && setup.tickers[name] ? setup.tickers[name] : name) as Asset
  return [resolveAccount(setup, `${type}_${ticker}` as AccountCode), ticker]
}

/**
 * Add a balance in the currency of the project.
 */
export function addOpeningBalance(state: OpeningState, account: AccountCode, value: Decimal): void {
  state.balance[account] = toCents(dec(state.balance[account] || 0).plus(value))
}

/**
 * Add an asset with its value in the currency of the project.
 */
export function addOpeningAsset(state: OpeningState, account: AccountCode, asset: Asset, amount: Decimal, value: Decimal): void {
  state.stock[account] = state.stock[account] || {}
  const old = state.stock[account][asset] || { amount: 0, value: 0 }
  state.stock[account][asset] = {
    amount: dec(old.amount).plus(amount).toNumber(),
    value: toCents(dec(old.value).plus(value)),
  }
}

/**
 * Remove zero balances and assets of no amount.
 */
export function cleanOpeningState(state: OpeningState): void {
  for (const account of Object.keys(state.balance)) {
    if (state.balance[account] === 0) {
      delete state.balance[account]
    }
  }
  for (const account of Object.keys(state.stock)) {
    for (const asset of Object.keys(state.stock[account])) {
      if (!state.stock[account][asset].amount) {
        delete state.stock[account][asset]
      }
    }
    if (Object.keys(state.stock[account]).length === 0) {
      delete state.stock[account]
    }
  }
}

/**
 * Merge opening states. Values entered by hand go first, then the states in the given order. Each balance and each
 * asset is taken whole from the first one having it. Differing values from the later states are noted.
 * @param date The date of the result.
 * @param states The states from the most trusted to the least trusted.
 * @param balance Balances entered by hand.
 * @param stock Assets entered by hand.
 * @param differs Function to describe a difference for the notes.
 */
export function mergeOpeningStates(
  date: string,
  states: OpeningState[],
  balance: BalanceData,
  stock: OpeningState['stock'],
  differs: (what: string, kept: string, other: string, source: string) => string
): OpeningState {
  const result: OpeningState = {
    date,
    sources: [],
    notes: [],
    balance: { ...balance },
    stock: Object.fromEntries(Object.entries(stock).map(([account, assets]) => [account, { ...assets }])),
  }
  const origin: Record<string, string> = {}

  for (const state of states) {
    for (const source of state.sources) {
      if (!result.sources.includes(source)) {
        result.sources.push(source)
      }
    }
    result.notes.push(...state.notes)

    for (const [account, value] of Object.entries(state.balance)) {
      if (account in result.balance) {
        if (!dec(result.balance[account]).eq(value)) {
          result.notes.push(differs(account, `${result.balance[account]}`, `${value}`, state.sources.join(', ')))
        }
        continue
      }
      result.balance[account] = value
      origin[account] = state.sources.join(', ')
    }

    for (const [account, assets] of Object.entries(state.stock)) {
      result.stock[account] = result.stock[account] || {}
      for (const [asset, record] of Object.entries(assets)) {
        const kept = result.stock[account][asset]
        if (kept) {
          if (!dec(kept.amount).eq(record.amount) || !dec(kept.value).eq(record.value)) {
            result.notes.push(differs(`${account} ${asset}`, `${kept.amount} / ${kept.value}`, `${record.amount} / ${record.value}`, state.sources.join(', ')))
          }
          continue
        }
        result.stock[account][asset] = { ...record }
      }
    }
  }

  cleanOpeningState(result)
  return result
}

/**
 * Move negative cash of currencies having a debt account to the debt account, since the analyzer keeps the currency
 * account at zero or above when there is one.
 * @param state
 * @param setup
 * @returns Currencies with negative cash, for which it is not yet known if a debt account is used.
 */
export function moveDebt(state: OpeningState, setup: Setup): Currency[] {
  const debtAccounts: Record<string, unknown> = (setup.settings?.debtAccounts as Record<string, unknown>) || {}
  const unknown: Currency[] = []

  for (const account of Object.keys(state.balance)) {
    const match = /^CURRENCY_([A-Z]{3})$/.exec(account)
    if (!match || state.balance[account] >= 0) {
      continue
    }
    const currency = match[1] as Currency
    if (!(currency in debtAccounts)) {
      unknown.push(currency)
      continue
    }
    if (debtAccounts[currency] === null) {
      continue
    }
    const debt = `DEBT_${account}`
    state.balance[debt] = toCents(dec(state.balance[debt] || 0).plus(state.balance[account]))
    delete state.balance[account]
  }

  return unknown
}
