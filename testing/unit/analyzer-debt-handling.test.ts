import { describe, expect, test } from 'vitest'
import { getDriver } from '../../backend/src/driver'
import { analyzeItems, createBatchFrom, unifyItems } from '../lib/unit-testing'
import { InputDriver } from '../../backend/src/driver/InputDriver'
import { UnifiedItemData } from '../../backend/src/types/API/UnifiedItemData'

describe('Analyzer', () => {

  const projectSettings = { currency: 'EUR', language: 'en' }

  test('handling debt for zero balance', async () => {

    const driver = getDriver('NORDNET', {}, projectSettings, {}) as InputDriver as InputDriver
    const batch = createBatchFrom('Nordnet-buy.csv')

    const items = await driver.itemizeInput(batch)
    expect(items.length).toBe(1)

    const unifieds = await unifyItems(driver, items)
    expect(unifieds.length).toBe(1)

    const data: UnifiedItemData = unifieds[0].data.data as unknown as UnifiedItemData
    data.tags = ['TAGG'] // Check that tags are copied to debt.

    const txs = await analyzeItems(unifieds, projectSettings, {
      settings: {
        debtAccounts: {
          EUR: '999'
        },
      }
    })

    expect(txs).toStrictEqual([
      {
        time: '2024-04-05T12:00:00.000Z',
        lines: [
          {
            account: 'DEBT_CURRENCY_EUR',
            amount: '-140.73',
            text: 'Bought +38 RIZF',
            extras: { tags: ['TAGG'] }
          },
          {
            account: 'STOCK_RIZF',
            amount: '140.73',
            text: 'Bought +38 RIZF',
            extras: { asset: 'RIZF', assetChange: '38', tags: ['TAGG'] }
          }
        ]
      }
    ])

  })

  test('handling debt with non-zero balance', async () => {

    const driver = getDriver('TEST_MOCK', {}, projectSettings, {}) as InputDriver as InputDriver
    const batch = createBatchFrom('Mock-debt.csv')

    const items = await driver.itemizeInput(batch)
    expect(items.length).toBe(3)

    const unifieds = await unifyItems(driver, items, 'TestMockDriver.json')
    expect(unifieds.length).toBe(3)

    const txs = await analyzeItems(unifieds, projectSettings, {
      settings: {
        debtAccounts: {
          EUR: '999'
        }
      }
    })

    expect(txs).toStrictEqual([
      {
        time: '2000-01-01T10:00:00.000Z',
        lines: [
          {
            account: 'DEBT_CURRENCY_EUR',
            amount: '-1000',
            text: 'Bought +1 ETH',
            extras: {}
          },
          {
            account: 'CRYPTO_ETH',
            amount: '1000',
            text: 'Bought +1 ETH',
            extras: { asset: 'ETH', assetChange: '1' }
          }
        ]
      },
      {
        time: '2000-01-01T12:00:00.000Z',
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '1000',
            text: 'Sold -1 ETH',
            extras: {}
          },
          {
            account: 'CRYPTO_ETH',
            amount: '-1000',
            text: 'Sold -1 ETH',
            extras: { asset: 'ETH', assetChange: '-1' }
          },
          {
            account: 'PROFIT_ETH',
            amount: '-1000',
            text: 'Sold -1 ETH',
            extras: {}
          },
          {
            account: 'DEBT_CURRENCY_EUR',
            amount: '1000',
            text: 'Sold -1 ETH',
            extras: {}
          }
        ]
      },
      {
        time: '2000-01-01T12:00:00.000Z',
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '-1000',
            text: 'Bought +3 ETH',
            extras: {}
          },
          {
            account: 'CRYPTO_ETH',
            amount: '3000',
            text: 'Bought +3 ETH',
            extras: { asset: 'ETH', assetChange: '3' }
          },
          {
            account: 'DEBT_CURRENCY_EUR',
            amount: '-2000',
            text: 'Bought +3 ETH',
            extras: {}
          }
        ]
      }
    ])
  })
})
