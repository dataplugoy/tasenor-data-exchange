import { describe, expect, test } from 'vitest'
import { getDriver } from '../../backend/src/driver'
import { analyzeItems, createBatchFrom, unifyItems } from '../lib/unit-testing'

describe('Nordnet', () => {

  test('deposit, buying, fee', async () => {

    const driver = getDriver('NORDNET', {})
    const batch = createBatchFrom('Nordnet-deposit-buy-fee.csv')

    const items = await driver.itemizeInput(batch)
    expect(items.length).toBe(6)

    const unifieds = await unifyItems(driver, items)
    expect(unifieds.length).toBe(6)

    const txs = await analyzeItems(unifieds, { currency: 'EUR', language: 'en' })

    expect(txs).toStrictEqual([
      {
        time: '2024-04-03T12:00:00.000Z',
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '-800',
            text: 'Deposit to Nordnet',
            extras: {}
          },
          {
            account: 'NORDNET_DEPOSIT_TO',
            amount: '800',
            text: 'Deposit to Nordnet',
            extras: {}
          }
        ]
      },
      {
        time: '2024-04-05T12:00:00.000Z',
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '-140.73',
            text: 'Bought +38 RIZF',
            extras: {}
          },
          {
            account: 'ASSET_RIZF',
            amount: '140.73',
            text: 'Bought +38 RIZF',
            extras: { asset: 'RIZF', assetChange: '38' }
          }
        ]
      },
      {
        time: '2024-04-05T12:00:00.000Z',
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '-91.63',
            text: 'Bought +3 WTEJ',
            extras: {}
          },
          {
            account: 'ASSET_WTEJ',
            amount: '91.63',
            text: 'Bought +3 WTEJ',
            extras: { asset: 'WTEJ', assetChange: '3' }
          }
        ]
      },
      {
        time: '2024-04-05T12:00:00.000Z',
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '-236.16',
            text: 'Bought +8 W1TA',
            extras: {}
          },
          {
            account: 'ASSET_W1TA',
            amount: '236.16',
            text: 'Bought +8 W1TA',
            extras: { asset: 'W1TA', assetChange: '8' }
          }
        ]
      },
      {
        time: '2024-04-05T12:00:00.000Z',
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '-316.14',
            text: 'Bought +43 IQQH',
            extras: {}
          },
          {
            account: 'ASSET_IQQH',
            amount: '316.14',
            text: 'Bought +43 IQQH',
            extras: { asset: 'IQQH', assetChange: '43' }
          }
        ]
      },
      {
        time: '2024-04-30T12:00:00.000Z',
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '-2.5',
            text: 'ETF-kuukausisaastosopimuksen palvelumaksu',
            extras: {}
          },
          {
            account: 'NORDNET_MONTHLY_SAVING_FEE',
            amount: '2.5',
            text: 'ETF-kuukausisaastosopimuksen palvelumaksu',
            extras: {}
          }
        ]
      },
    ])

  })


  test('sell', async () => {

    const driver = getDriver('NORDNET', {})
    const batch = createBatchFrom('Nordnet-sell.csv')

    const items = await driver.itemizeInput(batch)
    expect(items.length).toBe(3)

    const unifieds = await unifyItems(driver, items)
    expect(unifieds.length).toBe(3)

    const txs = await analyzeItems(unifieds, { currency: 'EUR', language: 'en' })

    expect(txs).toStrictEqual([
      {
        time: '2023-10-02T12:00:00.000Z',
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '-3607',
            text: 'Bought +1000 MANTA',
            extras: {}
          },
          {
            account: 'ASSET_MANTA',
            amount: '3600',
            text: 'Bought +1000 MANTA',
            extras: { asset: 'MANTA', assetChange: '1000' }
          },
          {
            account: 'FEE_EUR',
            amount: '7',
            text: 'Bought +1000 MANTA',
            extras: {}
          }
        ]
      },
      {
        time: '2024-01-25T12:00:00.000Z',
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '747.2',
            text: 'Sold -177 MANTA',
            extras: {}
          },
          {
            account: 'ASSET_MANTA',
            amount: '-637.2',
            text: 'Sold -177 MANTA',
            extras: { asset: 'MANTA', assetChange: '-177' }
          },
          {
            account: 'PROFIT_MANTA',
            amount: '-117',
            text: 'Sold -177 MANTA',
            extras: {}
          },
          {
            account: 'FEE_EUR',
            amount: '7',
            text: 'Sold -177 MANTA',
            extras: {}
          }
        ]
      },
      {
        time: '2024-04-10T12:00:00.000Z',
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '3554.12',
            text: 'Sold -823 MANTA',
            extras: {}
          },
          {
            account: 'ASSET_MANTA',
            amount: '-2962.8',
            text: 'Sold -823 MANTA',
            extras: { asset: 'MANTA', assetChange: '-823' }
          },
          {
            account: 'PROFIT_MANTA',
            amount: '-598.32',
            text: 'Sold -823 MANTA',
            extras: {}
          },
          {
            account: 'FEE_EUR',
            amount: '7',
            text: 'Sold -823 MANTA',
            extras: {}
          }
        ]
      }
    ]
    )
  })
})
