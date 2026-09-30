import { describe, expect, test } from 'vitest'
import fs from 'fs'
import path from 'path'
import { getDriver } from '../../backend/src/driver'
import { InputDriver } from '../../backend/src/driver/InputDriver'
import { coinbaseItems, coinbaseNumber, coinbaseTime, coinbaseVersion } from '../../backend/src/lib/coinbase'
import { createBatchFrom } from '../lib/unit-testing'

const sample = (version: number) => fs.readFileSync(path.join(__dirname, 'data', `Coinbase-v${version}.csv`)).toString('utf-8')

// Compact presentation of items without IDs and original data.
const summary = (version: number) => coinbaseItems(sample(version)).map(i => {
  const { Id, Type, ...fields } = i.fields as Record<string, unknown>
  return [i.time, fields]
})

describe('Coinbase', () => {

  test('helpers', () => {
    expect(coinbaseVersion(sample(1))).toStrictEqual({ version: 1, header: 0 })
    expect(coinbaseVersion(sample(2))).toStrictEqual({ version: 2, header: 7 })
    expect(coinbaseVersion(sample(3))).toStrictEqual({ version: 3, header: 3 })
    expect(coinbaseVersion(sample(4))).toStrictEqual({ version: 4, header: 3 })
    expect(coinbaseVersion('Statement,Header,Field Name,Field Value')).toBe(null)
    expect(coinbaseNumber('-€1296.03908')).toBe(-1296.03908)
    expect(coinbaseNumber('€2,350.00')).toBe(2350)
    expect(coinbaseNumber('€0.0009197001794225178686861089970715')).toBeCloseTo(0.00091970017942252, 17)
    expect(coinbaseNumber('')).toBe(0)
    expect(() => coinbaseNumber('abc')).toThrow()
    expect(coinbaseTime('2023-12-30T10:00:46Z')).toBe('2023-12-30T10:00:46.000Z')
    expect(coinbaseTime('2024-03-11 17:09:31 UTC')).toBe('2024-03-11T17:09:31.000Z')
    expect(coinbaseTime('2019-06-20T06:11:49.583Z')).toBe('2019-06-20T06:11:49.583Z')
  })

  test('v1 rows of a trade are combined', () => {
    expect(summary(1)).toStrictEqual([
      ['2019-06-20T06:11:49.583Z', { Kind: 'Deposit', Asset: 'EUR', Quantity: 1000 }],
      ['2019-06-24T15:26:17.594Z', { Kind: 'Buy', Asset: 'ETH', Quantity: 0.5, Currency: 'EUR', Value: 100, Fee: 0.15, Total: 100.15 }],
      ['2019-07-01T10:00:00.100Z', { Kind: 'Trade', GiveAsset: 'ETH', GiveQuantity: 0.2, GetAsset: 'BTC', GetQuantity: 0.01, GiveValue: null, GetValue: null, Currency: null, Fee: 0.000025, FeeAsset: 'BTC' }],
      ['2019-07-02T12:00:00.000Z', { Kind: 'Sell', Asset: 'ETH', Quantity: 0.3, Currency: 'EUR', Value: 60, Fee: 0.09, Total: 59.91 }],
      ['2019-07-03T08:00:00.000Z', { Kind: 'Withdrawal', Asset: 'EUR', Quantity: 500 }],
    ])
    expect(coinbaseItems(sample(1)).map(i => i.fields.Id)).toStrictEqual([
      'transfer:11111111-2222-3333-4444-555555555555', 'trade:1001', 'trade:1002', 'trade:1003', 'transfer:66666666-7777-8888-9999-000000000000'
    ])
  })

  test('v2 rows are sorted by time', () => {
    expect(summary(2)).toStrictEqual([
      ['2023-10-26T18:13:17.000Z', { Kind: 'Reward', Asset: 'GRT', Quantity: 10.5, Currency: 'EUR', Price: 0.1, Value: 1.05 }],
      ['2023-12-13T09:27:21.000Z', { Kind: 'Sell', Asset: 'ADA', Quantity: 1000.5, Currency: 'EUR', Value: 500.25, Fee: 7.5, Total: 492.75 }],
      ['2023-12-30T10:00:46.000Z', { Kind: 'Buy', Asset: 'BTC', Quantity: 0.05, Currency: 'EUR', Value: 2000, Fee: 30, Total: 2030 }],
    ])
  })

  test('v3 converts, transfers and fiat pseudo rows', () => {
    expect(summary(3)).toStrictEqual([
      ['2024-01-11T12:15:37.000Z', { Kind: 'Send', Asset: 'BSV', Quantity: 0.5, Currency: 'EUR', Price: 80, Value: 40 }],
      ['2024-01-11T15:00:16.000Z', { Kind: 'Trade', GiveAsset: 'BTC', GiveQuantity: 0.1, GetAsset: 'ETH', GetQuantity: 2.5, GiveValue: 4000, GetValue: 3900, Currency: 'EUR', Fee: 100, FeeAsset: 'EUR' }],
      ['2024-03-07T19:32:35.000Z', { Kind: 'Reward', Asset: 'NEAR', Quantity: 0.179420471875841, Currency: 'EUR', Price: 5, Value: 0.9 }],
      ['2024-03-07T19:36:34.000Z', { Kind: 'Sell', Asset: 'ETH', Quantity: 0.25, Currency: 'EUR', Value: 1000, Fee: 15, Total: 985 }],
      ['2024-03-08T07:51:03.000Z', { Kind: 'Receive', Asset: 'USDC', Quantity: 20.5, Currency: 'EUR', Price: 0.9, Value: 18.45 }],
    ])
  })

  test('v4 advanced trades against fiat and crypto, signed amounts', () => {
    expect(summary(4)).toStrictEqual([
      ['2024-10-01T10:00:00.000Z', { Kind: 'Deposit', Asset: 'EUR', Quantity: 1000 }],
      ['2024-10-29T17:54:42.000Z', { Kind: 'Reward', Asset: 'ALEO', Quantity: 0.657678, Currency: 'EUR', Price: 1.4, Value: 0.92 }],
      ['2024-11-07T19:12:25.000Z', { Kind: 'Sell', Asset: 'BTC', Quantity: 0.001, Currency: 'EUR', Value: 70, Fee: 1.05, Total: 68.95 }],
      ['2024-11-12T15:40:31.000Z', { Kind: 'Withdrawal', Asset: 'EUR', Quantity: 500 }],
      ['2024-12-04T15:34:21.000Z', { Kind: 'Buy', Asset: 'BTC', Quantity: 0.02, Currency: 'EUR', Value: 1800, Fee: 7.2, Total: 1807.2 }],
      ['2024-12-05T05:06:46.000Z', { Kind: 'Sell', Asset: 'BTC', Quantity: 0.01, Currency: 'EUR', Value: 910, Fee: 3.64, Total: 906.36 }],
      ['2025-08-01T16:06:36.000Z', { Kind: 'Trade', GiveAsset: 'ETH', GiveQuantity: 0.4, GetAsset: 'BTC', GetQuantity: 0.01188, GiveValue: 1200, GetValue: 1190.4, Currency: 'EUR', Fee: 9.6, FeeAsset: 'EUR' }],
      ['2025-08-20T18:43:44.000Z', { Kind: 'Trade', GiveAsset: 'BTC', GiveQuantity: 0.0181, GetAsset: 'ETH', GetQuantity: 0.5, GiveValue: 1814.4, GetValue: 1800, Currency: 'EUR', Fee: 14.4, FeeAsset: 'EUR' }],
    ])
    expect(coinbaseItems(sample(4)).map(i => i.fields.Id)[0]).toBe('a00000000000000000000008')
  })

  test('unknown transaction type is an error', () => {
    const text = sample(4).replace('Learning Reward', 'Mystery')
    expect(() => coinbaseItems(text)).toThrow('Unsupported Coinbase transaction type "Mystery"')
  })

  test('driver itemizes uploads and recognizes events by ID', async () => {
    const driver = getDriver('COINBASE', {}, { currency: 'EUR', language: 'en' }, {}) as InputDriver
    const items = await driver.itemizeInput(createBatchFrom('Coinbase-v3.csv'))
    expect(items.length).toBe(5)
    const hashes = items.map(i => driver.inputHash(i))
    expect(new Set(hashes).size).toBe(5)
    expect(driver.inputHash({ ...items[0], fields: { ...items[0].fields, Extra: 1 } })).toBe(hashes[0])
    await expect(driver.itemizeInput(createBatchFrom('Lynx-statement.csv'))).rejects.toThrow('not a Coinbase')
  })
})
