import { describe, expect, test } from 'vitest'
import fs from 'fs'
import path from 'path'
import { getDriver } from '../../backend/src/driver'
import { InputDriver } from '../../backend/src/driver/InputDriver'
import { isLynx, lynxItems, lynxNumber, lynxTime, parseLynxRows } from '../../backend/src/lib/lynx'
import { createBatchFrom } from '../lib/unit-testing'

const sample = fs.readFileSync(path.join(__dirname, 'data', 'Lynx-statement.csv')).toString('utf-8')

describe('Lynx', () => {

  test('helpers', () => {
    expect(isLynx(sample)).toBe(true)
    expect(isLynx('Id\tKirjauspäivä')).toBe(false)
    expect(lynxNumber('"1,000"'.replace(/"/g, ''))).toBe(1000)
    expect(lynxNumber('10,846.4')).toBe(10846.4)
    expect(lynxNumber('')).toBe(0)
    expect(() => lynxNumber('abc')).toThrow()
    expect(lynxTime('2023-02-01, 10:00:00')).toBe('2023-02-01T10:00:00.000Z')
    expect(lynxTime('2023-02-01')).toBe('2023-02-01T12:00:00.000Z')
  })

  test('rows of used sections', () => {
    const rows = parseLynxRows(sample)
    const count: Record<string, number> = {}
    rows.forEach(r => { count[r.section] = (count[r.section] || 0) + 1 })
    // Totals, repeated sections with Code column and unused sections are skipped.
    expect(count).toStrictEqual({
      Trades: 6,
      'Deposits & Withdrawals': 3,
      Fees: 1,
      Dividends: 3,
      'Withholding Tax': 5,
      Interest: 2,
      'Corporate Actions': 6,
    })
    const forex = rows.find(r => r.fields['Asset Category'] === 'Forex')
    expect(forex?.fields['Comm/Fee']).toBe('-2')
  })

  test('items', () => {
    const items = lynxItems(parseLynxRows(sample))
    const summary = items.map(i => {
      const { Key, Description, ...fields } = i.fields as Record<string, unknown>
      return [i.time.substring(0, 16), i.total, fields]
    })
    expect(summary).toStrictEqual([
      ['2022-11-15T12:00', 1.5, { Kind: 'TaxAdjustment', Currency: 'USD', Date: '2022-11-15', Symbol: 'EEE', ISIN: 'US0000000003', Amount: 1.5 }],
      ['2023-01-10T12:00', 15000, { Kind: 'Deposit', Currency: 'EUR', Amount: 15000 }],
      ['2023-01-15T09:00', -10800, { Kind: 'Forex', Base: 'EUR', Quote: 'USD', Quantity: 10000, Price: 1.08, Proceeds: -10800, Fee: -2, FeeCurrency: 'EUR', Code: '' }],
      ['2023-02-01T10:00', -10500, { Kind: 'Trade', AssetCategory: 'Stocks', Currency: 'USD', Symbol: 'AAA', Quantity: 1000, Price: 10.5, Proceeds: -10500, Fee: -5, RealizedPL: 0, Code: 'O' }],
      ['2023-02-03T12:00', -9.49, { Kind: 'Interest', Currency: 'EUR', Amount: -9.49, Month: 'Jan-2023' }],
      ['2023-03-01T11:00', 4800, { Kind: 'Trade', AssetCategory: 'Stocks', Currency: 'USD', Symbol: 'AAA', Quantity: -400, Price: 12, Proceeds: 4800, Fee: -5, RealizedPL: 593, Code: 'C' }],
      ['2023-03-02T12:00', 200, { Kind: 'Trade', AssetCategory: 'Stocks', Currency: 'USD', Symbol: 'BBB', Quantity: -10, Price: 20, Proceeds: 200, Fee: -1, RealizedPL: 0, Code: 'O' }],
      ['2023-03-03T20:25', 15, { Kind: 'Trade', AssetCategory: 'Stocks', Currency: 'USD', Symbol: 'CCC', Quantity: -0.5, Price: 30, Proceeds: 15, Fee: 0, RealizedPL: 0, Code: 'O' }],
      ['2023-03-03T20:25', 15, { Kind: 'Trade', AssetCategory: 'Stocks', Currency: 'USD', Symbol: 'CCC', Quantity: -0.5, Price: 30, Proceeds: 15, Fee: 0, RealizedPL: 0, Code: 'O' }],
      ['2023-04-01T12:00', 0.62, { Kind: 'TransferAdjustment', Currency: 'USD', Amount: 0.62 }],
      ['2023-05-03T12:00', -5.05, { Kind: 'Fee', Currency: 'EUR', Amount: -5.05 }],
      ['2023-06-15T12:00', 136, { Kind: 'Dividend', Currency: 'USD', Date: '2023-06-15', Symbol: 'AAA', ISIN: 'US0000000001', Amount: 160, Tax: -24, PerShare: 0.25, PaymentInLieu: true, ReturnOfCapital: false }],
      ['2023-07-01T12:00', 37.5, { Kind: 'Dividend', Currency: 'EUR', Date: '2023-07-01', Symbol: 'DDD1V', ISIN: 'FI0000000002', Amount: 50, Tax: -12.5, PerShare: 0.5, PaymentInLieu: false, ReturnOfCapital: false }],
      ['2023-08-01T20:25', 0, { Kind: 'CorporateAction', Action: 'Split', Currency: 'USD', Symbol: 'AAA', ISIN: 'US0000000001', RatioNew: 2, RatioOld: 1, OutSymbol: 'AAA.OLD', OutQuantity: 600, InSymbol: 'AAA', InQuantity: 1200, Value: 0, Legs: 2 }],
      ['2023-09-01T20:25', 0, { Kind: 'CorporateAction', Action: 'Spinoff', Currency: 'USD', Symbol: 'AAA', ISIN: 'US0000000011', RatioNew: 1, RatioOld: 10, OutSymbol: null, OutQuantity: null, InSymbol: 'FFF', InQuantity: 120, Value: 0, Legs: 1 }],
      ['2023-10-01T20:25', 0, { Kind: 'CorporateAction', Action: 'Merger', Currency: 'USD', Symbol: 'FFF', ISIN: 'US0000000004', RatioNew: 3, RatioOld: 2, OutSymbol: 'FFF', OutQuantity: 120, InSymbol: 'GGG', InQuantity: 180, Value: 0, Legs: 2 }],
      ['2023-10-03T12:00', 2.2, { Kind: 'Interest', Currency: 'USD', Amount: 2.2, Month: 'Sep-2023' }],
      ['2023-12-01T20:20', 0, { Kind: 'CorporateAction', Action: 'StockDividend', Currency: 'USD', Symbol: 'GGG', ISIN: 'US0000000005', RatioNew: 1, RatioOld: 100, OutSymbol: null, OutQuantity: null, InSymbol: 'GGG', InQuantity: 1.8, Value: 9, Legs: 1 }],
      ['2023-12-20T12:00', -1000, { Kind: 'Withdrawal', Currency: 'EUR', Amount: -1000 }],
    ])
  })

  test('keys are unique and stable', () => {
    const items = lynxItems(parseLynxRows(sample))
    const keys = items.map(i => i.fields.Key)
    expect(new Set(keys).size).toBe(items.length)
    expect(keys).toContain('Trade:2023-03-03, 20:25:00:CCC:-0.5:30:O')
    expect(keys).toContain('Trade:2023-03-03, 20:25:00:CCC:-0.5:30:O:2')
    expect(keys).toContain('Dividend:2023-06-15:US0000000001')
    // A later statement covering the same period gives the same keys.
    const again = lynxItems(parseLynxRows(sample)).map(i => i.fields.Key)
    expect(again).toStrictEqual(keys)
  })

  test('driver itemizes uploaded statement', async () => {
    const driver = getDriver('LYNX', {}, { currency: 'EUR', language: 'en' }, {}) as InputDriver
    const batch = createBatchFrom('Lynx-statement.csv')
    const items = await driver.itemizeInput(batch)
    expect(items.length).toBe(19)
  })
})
