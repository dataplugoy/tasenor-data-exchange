import { describe, expect, test } from 'vitest'
import fs from 'fs'
import path from 'path'
import { getDriver } from '../../backend/src/driver'
import { InputDriver } from '../../backend/src/driver/InputDriver'
import { isLynx, lynxItems, lynxNumber, lynxPeriod, lynxTime, parseLynxRows } from '../../backend/src/lib/lynx'
import { JsonFileService } from '../../backend/src/lib/services/JsonFileService'
import { analyzeItems, createBatchFrom, unifyItems } from '../lib/unit-testing'

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
    expect(lynxPeriod(sample)).toStrictEqual({ start: '2023-01-01', end: '2023-12-31' })
    expect(lynxPeriod('Statement,Data,Period,"March 5, 2024"')).toStrictEqual({ start: '2024-03-05', end: '2024-03-05' })
    expect(lynxPeriod('Id\tKirjauspäivä')).toBe(null)
  })

  test('tax adjustments of earlier periods are booked on the first day of the period', () => {
    const items = lynxItems(parseLynxRows(sample), '2023-01-01')
    const adjustment = items.find(i => i.fields.Kind === 'TaxAdjustment')
    expect(adjustment?.time).toBe('2023-01-01T12:00:00.000Z')
    expect(adjustment?.fields.Date).toBe('2022-11-15')
    expect(adjustment?.fields.Key).toBe('TaxAdjustment:2022-11-15:US0000000003')
    expect(items.indexOf(adjustment!)).toBe(0)
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
      'Corporate Actions': 10,
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
      ['2023-01-15T09:00', -10800, { Kind: 'Forex', Base: 'EUR', Quote: 'USD', Quantity: 10000, Price: 1.08, Proceeds: -10800, Fee: -2, FeeCurrency: 'EUR', Profit: 5, Code: '' }],
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
      ['2023-08-01T20:25', 0, { Kind: 'CorporateAction', Action: 'Split', Currency: 'USD', Symbol: 'AAA', ISIN: 'US0000000001', RatioNew: 2, RatioOld: 1, OutSymbol: 'AAA.OLD', OutQuantity: 600, InSymbol: 'AAA', InQuantity: 1200, OutValue: 0, InValue: 0, Value: 0, Legs: 2 }],
      ['2023-09-01T20:25', 0, { Kind: 'CorporateAction', Action: 'Spinoff', Currency: 'USD', Symbol: 'AAA', ISIN: 'US0000000011', RatioNew: 1, RatioOld: 10, OutSymbol: null, OutQuantity: null, InSymbol: 'FFF', InQuantity: 120, OutValue: null, InValue: 0, Value: 0, Legs: 1 }],
      ['2023-10-01T20:25', 0, { Kind: 'CorporateAction', Action: 'Merger', Currency: 'USD', Symbol: 'FFF', ISIN: 'US0000000004', RatioNew: 3, RatioOld: 2, OutSymbol: 'FFF', OutQuantity: 120, InSymbol: 'GGG', InQuantity: 180, OutValue: 900, InValue: 900, Value: 0, Legs: 2 }],
      ['2023-10-03T12:00', 2.2, { Kind: 'Interest', Currency: 'USD', Amount: 2.2, Month: 'Sep-2023' }],
      ['2023-11-01T20:25', 0, { Kind: 'CorporateAction', Action: 'Split', Currency: 'USD', Symbol: 'AAA', ISIN: 'US0000000011', RatioNew: 1, RatioOld: 4, OutSymbol: 'AAA.OLD', OutQuantity: 1200, InSymbol: 'III', InQuantity: 300, OutValue: 0, InValue: 0, Value: 0, Legs: 2 }],
      ['2023-11-15T20:25', 0, { Kind: 'CorporateAction', Action: 'IsinChange', Currency: 'USD', Symbol: 'GGG', ISIN: 'US0000000005', RatioNew: null, RatioOld: null, OutSymbol: '20231115GGG', OutQuantity: 180, InSymbol: 'GGG', InQuantity: 180, OutValue: 0, InValue: 0, Value: 0, Legs: 2 }],
      ['2023-12-01T20:20', 0, { Kind: 'CorporateAction', Action: 'StockDividend', Currency: 'USD', Symbol: 'GGG', ISIN: 'US0000000005', RatioNew: 1, RatioOld: 100, OutSymbol: null, OutQuantity: null, InSymbol: 'GGG', InQuantity: 1.8, OutValue: null, InValue: 9, Value: 9, Legs: 1 }],
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
    expect(items.length).toBe(21)
    // Duplicates are recognized by the key only.
    const hashes = items.map(i => driver.inputHash(i))
    expect(new Set(hashes).size).toBe(21)
    expect(driver.inputHash({ ...items[3], fields: { ...items[3].fields, Extra: 1 } })).toBe(hashes[3])
  })

  test('default rules', async () => {
    const settings = { currency: 'EUR', language: 'en' }
    const driver = getDriver('LYNX', {}, settings, {}) as InputDriver
    const items = await driver.itemizeInput(createBatchFrom('Lynx-statement.csv'))
    const unifieds = await unifyItems(driver, items, 'LynxDriver.json')
    const txs = await analyzeItems(unifieds, settings, null, [new JsonFileService({ url: 'file:///lynx-rates.json' })])
    const summary = txs.map(tx => [tx.time.substring(0, 10), tx.lines.length ? tx.lines[0].text : '', tx.lines.map(l => `${l.account} ${l.amount}${l.extras.assetChange ? ` (${l.extras.assetChange})` : ''}`)])
    expect(summary).toStrictEqual([
      ['2023-01-01', 'Withholding tax correction for EEE', ['CURRENCY_USD 1.35', 'TAX_WITHHOLDING -1.35']],
      ['2023-01-10', 'Deposit to Lynx', ['CURRENCY_EUR 15000', 'EXTERNAL_LYNX_EUR -15000']],
      ['2023-01-15', 'Bought 10000.00 EUR in exhcange to USD', ['CURRENCY_USD -9995', 'CURRENCY_EUR 10000', 'CURRENCY_EUR -2', 'FEE_EUR 2', 'FOREX_PROFIT -5']],
      ['2023-02-01', 'Bought +1000 AAA', ['CURRENCY_USD -9454.5', 'STOCK_AAA 9450 (1000)', 'FEE_USD 4.5']],
      ['2023-02-03', 'Interest expense', ['CURRENCY_EUR -9.49', 'EXPENSE_INTEREST 9.49']],
      ['2023-03-01', 'Sold -400 AAA', ['CURRENCY_USD 4315.5', 'STOCK_AAA -3780 (-400)', 'PROFIT_AAA -540', 'FEE_USD 4.5']],
      ['2023-03-02', 'Sold short -10 BBB', ['CURRENCY_USD 179.1', 'STOCK_BBB -180 (-10)', 'FEE_USD 0.9']],
      ['2023-03-03', 'Sold short -0.5 CCC', ['CURRENCY_USD 13.5', 'STOCK_CCC -13.5 (-0.5)']],
      ['2023-03-03', 'Sold short -0.5 CCC', ['CURRENCY_USD 13.5', 'STOCK_CCC -13.5 (-0.5)']],
      ['2023-04-01', 'Adjustment: Cash Receipt/Disbursement/Transfer (Transfer to U0000000)', ['CURRENCY_USD 0.56', 'INCOME_CORRECTION_DEPOSIT -0.56']],
      ['2023-05-03', 'LYNX MONTHLY MINIMUM ACTIVITY FEE FOR APR 2023', ['CURRENCY_EUR -5.05', 'EXPENSE_BROKER_FEE 5.05']],
      ['2023-06-15', 'Dividend for AAA', ['CURRENCY_USD 122.4', 'INCOME_DIVIDEND -144', 'TAX_WITHHOLDING 21.6']],
      ['2023-07-01', 'Dividend for DDD1V', ['CURRENCY_EUR 37.5', 'INCOME_DIVIDEND -50', 'TAX_WITHHOLDING 12.5']],
      ['2023-08-01', 'AAA(US0000000001) Split 2 for 1 (AAA, AAA INC, US0000000011)', ['STOCK_AAA 0 (-600)', 'STOCK_AAA 0 (1200)']],
      ['2023-09-01', 'AAA(US0000000011) Spinoff  1 for 10 (FFF, FFF HOLDINGS, US0000000004)', ['STOCK_FFF 0 (120)']],
      ['2023-10-01', 'FFF(US0000000004) Merged(Acquisition) WITH US0000000005 3 FOR 2 (GGG, GGG CORP, US0000000005)', ['STOCK_FFF 0 (-120)', 'STOCK_GGG 810 (180)', 'PROFIT_FFF -810']],
      ['2023-10-03', 'Interest expense refund', ['CURRENCY_USD 1.98', 'EXPENSE_INTEREST -1.98']],
      ['2023-11-01', 'AAA(US0000000011) Split 1 for 4 (III, III INC, US0000000006)', ['STOCK_AAA -5670 (-1200)', 'STOCK_III 5670 (300)']],
      ['2023-11-15', '', []],
      ['2023-12-01', 'GGG (US0000000005) Stock Dividend US0000000005 1 for 100 (GGG, GGG CORP, US0000000005)', ['STOCK_GGG 8.1 (1.8)', 'INCOME_STOCK_DIVIDEND -8.1']],
      ['2023-12-20', 'Withdrawal from Lynx', ['CURRENCY_EUR -1000', 'EXTERNAL_LYNX_EUR 1000']],
    ])
  })
})
