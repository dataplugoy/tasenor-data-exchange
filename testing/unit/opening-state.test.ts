import { beforeAll, describe, expect, test } from 'vitest'
import fs from 'fs'
import path from 'path'
import { dec } from '../../backend/src/lib/utils'
import { getDriver } from '../../backend/src/driver'
import { InputDriver } from '../../backend/src/driver/InputDriver'
import { TasenorDriver } from '../../backend/src/driver/TasenorDriver'
import { lynxOpening } from '../../backend/src/lib/lynx'
import { nordnetOpening } from '../../backend/src/lib/nordnet'
import { parseTitoRecords, titoOpening } from '../../backend/src/lib/tito'
import { RateFunction, mergeOpeningStates, moveDebt } from '../../backend/src/lib/opening'
import { initI18N } from '../../backend/src/lib/i18n/t'
import { OpeningState } from '../../backend/src/types/API/OpeningState'
import { createBatchFrom } from '../lib/unit-testing'

const projectSettings = { currency: 'EUR', language: 'en' }

// USD is 0.9 EUR, other currencies are not known.
const rate: RateFunction = async (currency) => currency === 'USD' ? dec(0.9) : null

const differs = (what: string, kept: string, other: string, source: string) => `${what}: ${kept} / ${source} ${other}`

describe('Opening state', () => {

  beforeAll(async () => {
    await initI18N()
  })

  describe('Nordea TITO', () => {

    const sample = fs.readFileSync(path.join(__dirname, 'data', 'Nordea-tito.nda')).toString('latin1')

    test('opening balances of the statements', () => {
      expect(titoOpening(parseTitoRecords(sample), '1970-01-01')).toStrictEqual({
        date: '2023-01-01',
        accounts: [
          { Tilinumero: 'FI001234560000', Valuutta: 'EUR', balance: 1000 },
          { Tilinumero: 'FI006543210000', Valuutta: 'EUR', balance: 50 },
        ]
      })
    })

    test('transactions before the first date are added', () => {
      expect(titoOpening(parseTitoRecords(sample), '2023-01-10')).toStrictEqual({
        date: '2023-01-10',
        accounts: [
          { Tilinumero: 'FI001234560000', Valuutta: 'EUR', balance: 1234.65 },
          { Tilinumero: 'FI006543210000', Valuutta: 'EUR', balance: 50 },
        ]
      })
    })

    test('driver', async () => {
      const driver = getDriver('NORDEA_TITO', {}, projectSettings, {}) as InputDriver
      expect(driver.canProvideOpeningState()).toBe(true)
      expect(await driver.openingState(createBatchFrom('Nordea-tito.nda'), '1970-01-01', rate)).toStrictEqual({
        date: '2023-01-01',
        sources: ['NORDEA_TITO'],
        notes: [],
        balance: { BANK_FI001234560000: 1000, BANK_FI006543210000: 50 },
        stock: {},
      })
    })
  })

  describe('Lynx', () => {

    const sample = fs.readFileSync(path.join(__dirname, 'data', 'Lynx-opening.csv')).toString('utf-8')

    test('cash and positions at the start of the statement', () => {
      expect(lynxOpening(sample, '1970-01-01')).toStrictEqual({
        date: '2024-01-01',
        cash: [{ currency: 'EUR', amount: -2000 }, { currency: 'USD', amount: 1500 }],
        positions: [
          // Costs worked back from the open positions and the trades.
          { currency: 'EUR', symbol: 'DDD1V', amount: 200, cost: 1600 },
          { currency: 'USD', symbol: 'AAA', amount: 500, cost: 5000 },
        ],
        corporateActions: false,
      })
    })

    test('cash and positions later in the statement', () => {
      expect(lynxOpening(sample, '2024-02-15')).toStrictEqual({
        date: '2024-02-15',
        cash: [{ currency: 'EUR', amount: -2012.34 }, { currency: 'USD', amount: -501 }],
        positions: [
          { currency: 'EUR', symbol: 'DDD1V', amount: 200, cost: 1600 },
          { currency: 'USD', symbol: 'AAA', amount: 500, cost: 5000 },
          { currency: 'USD', symbol: 'BBB', amount: 100, cost: 2001 },
        ],
        corporateActions: false,
      })
    })

    test('corporate actions are noticed', () => {
      const other = fs.readFileSync(path.join(__dirname, 'data', 'Lynx-statement.csv')).toString('utf-8')
      expect(lynxOpening(other, '1970-01-01')?.corporateActions).toBe(true)
    })

    test('driver converts to the currency of the project', async () => {
      const driver = getDriver('LYNX', {}, projectSettings, {}) as InputDriver
      expect(await driver.openingState(createBatchFrom('Lynx-opening.csv'), '1970-01-01', rate)).toStrictEqual({
        date: '2024-01-01',
        sources: ['LYNX'],
        notes: [
          'Values in USD are converted at the rate of 2024-01-01.',
          'The statement tells the cost of assets in USD only in USD. Their value is converted at the rate of 2024-01-01, not at the rates of the purchases.',
        ],
        balance: { CURRENCY_EUR: -2000, CURRENCY_USD: 1350, STOCK_DDD1V: 1600, STOCK_AAA: 4500 },
        stock: {
          STOCK_DDD1V: { DDD1V: { amount: 200, value: 1600 } },
          STOCK_AAA: { AAA: { amount: 500, value: 4500 } },
        },
      })
    })

    test('driver uses the account grouping and the tickers of the setup', async () => {
      const driver = getDriver('LYNX', {}, projectSettings, { accountGrouping: { singleStockAccount: true }, tickers: { AAA: 'AAA2' } }) as InputDriver
      const state = await driver.openingState(createBatchFrom('Lynx-opening.csv'), '1970-01-01', rate)
      expect(state?.balance).toStrictEqual({ CURRENCY_EUR: -2000, CURRENCY_USD: 1350, STOCK: 6100 })
      expect(state?.stock).toStrictEqual({ STOCK: { DDD1V: { amount: 200, value: 1600 }, AAA2: { amount: 500, value: 4500 } } })
    })

    test('values without a rate are left out', async () => {
      const driver = getDriver('LYNX', {}, projectSettings, {}) as InputDriver
      const state = await driver.openingState(createBatchFrom('Lynx-opening.csv'), '1970-01-01', async () => null)
      expect(state?.balance).toStrictEqual({ CURRENCY_EUR: -2000, STOCK_DDD1V: 1600 })
      expect(state?.notes.slice(0, 2)).toStrictEqual([
        'There is no rate for USD on 2024-01-01, so USD is left out.',
        'There is no rate for USD on 2024-01-01, so AAA is left out.',
      ])
    })
  })

  describe('Nordnet', () => {

    const rows = async (file: string) => {
      const driver = getDriver('NORDNET', {}, projectSettings, {}) as InputDriver
      return (await driver.itemizeInput(createBatchFrom(file))).map(item => item.fields)
    }

    test('state before a buy', async () => {
      expect(nordnetOpening(await rows('Nordnet-buy.csv'), '1970-01-01', 'EUR')).toStrictEqual({
        date: '2024-04-05',
        cash: [{ currency: 'EUR', amount: 170.21 }],
        positions: [{ currency: 'EUR', security: 'RIZF', amount: 710, cost: 2646.86 }],
        unknown: [],
      })
    })

    test('state before a sell', async () => {
      const sell = (await rows('Nordnet-sell.csv')).filter(row => row.Kirjauspäivä === '2024-04-10')
      expect(nordnetOpening(sell, '1970-01-01', 'EUR')?.positions).toStrictEqual([
        { currency: 'EUR', security: 'MANTA', amount: 823, cost: 2968.56 },
      ])
    })

    test('state after the last row before the first date', async () => {
      expect(nordnetOpening(await rows('Nordnet-sell.csv'), '2024-04-01', 'EUR')).toStrictEqual({
        date: '2024-04-01',
        cash: [{ currency: 'EUR', amount: -7971.42 }],
        positions: [{ currency: 'EUR', security: 'MANTA', amount: 823, cost: 2968.56 }],
        unknown: [],
      })
    })

    test('cash is kept per currency', async () => {
      expect(nordnetOpening(await rows('Nordnet-forex.csv'), '1970-01-01', 'EUR')?.cash).toStrictEqual([
        { currency: 'EUR', amount: 996.57 },
        { currency: 'USD', amount: 19.09 },
      ])
    })

    test('positions moved out cannot be worked out', async () => {
      expect(nordnetOpening(await rows('Nordnet-split.csv'), '1970-01-01', 'EUR')?.unknown).toStrictEqual([
        { security: 'CTY1S.OLD', type: 'SPLIT AP OTTO' },
      ])
    })

    test('driver', async () => {
      const driver = getDriver('NORDNET', {}, projectSettings, {}) as InputDriver
      expect(await driver.openingState(createBatchFrom('Nordnet-buy.csv'), '1970-01-01', rate)).toStrictEqual({
        date: '2024-04-05',
        sources: ['NORDNET'],
        notes: ['Holdings are known only for the securities bought or sold in the file.'],
        balance: { CURRENCY_EUR: 170.21, STOCK_RIZF: 2646.86 },
        stock: { STOCK_RIZF: { RIZF: { amount: 710, value: 2646.86 } } },
      })
    })
  })

  describe('Tasenor', () => {

    const setup = {
      accounts: { CURRENCY_EUR: '1910', STOCK: '1540', INCOME: '3000', EXPENSE: '3000' },
      settings: { debtAccounts: { EUR: '2500', USD: null } },
    }

    const entry = (account_id: number, debit: number, amount: number, data = {}) => ({ account_id, debit, amount, data })

    const driver = getDriver('TASENOR', { host: 'http://localhost', user: 'u', password: 'p', database: 'db' }, projectSettings, setup) as TasenorDriver
    Object.assign(driver, {
      accounts: {
        1910: { id: 1, number: '1910' },
        1540: { id: 2, number: '1540' },
        2500: { id: 3, number: '2500' },
        3000: { id: 4, number: '3000' },
      },
      loadAccounts: async () => {},
      getPeriods: async () => [
        { id: 7, start_date: '2023-01-01', end_date: '2023-12-31' },
        { id: 8, start_date: '2024-01-01', end_date: '2024-12-31' },
      ],
      GET: async (url: string) => {
        expect(url).toBe('/db/db/document?period=8&entries')
        return [
          {
            number: 0,
            date: '2024-01-01',
            entries: [
              entry(1, 1, 50000),
              entry(2, 1, 300000, { stock: { set: { AAA: { amount: 10, value: 300000 } } } }),
              entry(3, 0, 20000),
            ]
          },
          {
            number: 2,
            date: '2024-02-01',
            entries: [entry(1, 0, 99900), entry(4, 1, 99900)]
          },
          {
            number: 1,
            date: '2024-01-15',
            entries: [
              entry(1, 0, 10000),
              entry(2, 1, 10000, { stock: { change: { AAA: { amount: 1, value: 10000 } } } }),
            ]
          },
        ]
      },
    })

    test('balances and assets before the date', async () => {
      expect(driver.canProvideOpeningState()).toBe(true)
      expect(await driver.openingState('2024-02-01')).toStrictEqual({
        date: '2024-02-01',
        sources: ['TASENOR'],
        notes: ['The accounts INCOME, EXPENSE are all booked to 3000, so their balances cannot be told apart.'],
        balance: { CURRENCY_EUR: 400, STOCK: 3100, DEBT_CURRENCY_EUR: -200 },
        stock: { STOCK: { AAA: { amount: 11, value: 3100 } } },
      })
    })

    test('a date without a period', async () => {
      const state = await driver.openingState('2025-01-01')
      expect(state?.notes).toStrictEqual(['There is no period for 2025-01-01 in the bookkeeping.'])
      expect(state?.balance).toStrictEqual({})
    })
  })

  describe('Merging', () => {

    const state = (source: string, balance: OpeningState['balance'], stock: OpeningState['stock'] = {}): OpeningState => ({
      date: '2024-01-01', sources: [source], notes: [`from ${source}`], balance, stock
    })

    test('values entered by hand, then the states in order', () => {
      const merged = mergeOpeningStates(
        '2024-01-01',
        [
          state('TASENOR', { CURRENCY_EUR: 100, STOCK: 50 }, { STOCK: { AAA: { amount: 1, value: 50 } } }),
          state('LYNX', { CURRENCY_EUR: 90, CURRENCY_USD: 5, STOCK: 50 }, { STOCK: { AAA: { amount: 1, value: 50 }, BBB: { amount: 2, value: 0 } } }),
        ],
        { CURRENCY_USD: 7 },
        {},
        differs
      )
      expect(merged).toStrictEqual({
        date: '2024-01-01',
        sources: ['TASENOR', 'LYNX'],
        notes: ['from TASENOR', 'from LYNX', 'CURRENCY_EUR: 100 / LYNX 90', 'CURRENCY_USD: 7 / LYNX 5'],
        balance: { CURRENCY_USD: 7, CURRENCY_EUR: 100, STOCK: 50 },
        stock: { STOCK: { AAA: { amount: 1, value: 50 }, BBB: { amount: 2, value: 0 } } },
      })
    })

    test('negative cash goes to the debt account when there is one', () => {
      const merged = state('LYNX', { CURRENCY_EUR: -2000, CURRENCY_USD: -10, CURRENCY_SEK: -5, CURRENCY_GBP: 3 })
      expect(moveDebt(merged, { settings: { debtAccounts: { EUR: '2500', USD: null } } })).toStrictEqual(['SEK'])
      expect(merged.balance).toStrictEqual({ CURRENCY_USD: -10, CURRENCY_SEK: -5, CURRENCY_GBP: 3, DEBT_CURRENCY_EUR: -2000 })
    })
  })
})
