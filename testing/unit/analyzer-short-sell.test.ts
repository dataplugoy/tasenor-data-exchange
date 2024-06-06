import { describe, expect, it } from 'vitest'
import { Analyzer } from '../../backend/src/lib/analyzer/Analyzer'
import { Asset, Timestring } from '@tasenor/common'
import { UnifiedItemType } from '../../backend/src/types/API/UnifiedItemData'

describe('Analyzer', () => {

  const projectSettings = { currency: 'EUR', language: 'en' }

  it('short-selling without fee', async () => {

    const stock = {
      STOCK_GME: { GME: { value: 0, amount: 0 } }
    }
    const input = {
      type: 'sell' as UnifiedItemType,
      value: 100,
      assetOut: 'GME' as Asset,
      assetTypeOut: 'STOCK',
      assetAmountOut: 20,
    }

    const analyzer = await Analyzer.run(projectSettings, '2000-01-01T00:00:00Z' as Timestring, stock, input)

    expect(analyzer.toJSON()).toStrictEqual({
      balances: {
        CURRENCY_EUR: 100, STOCK_GME: -100 ,
      },
      stock: {
        STOCK_GME: { GME: { amount: -20, value: -100 } }
      },
      tx: {
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '100',
            text: 'Sold short -20 GME',
            extras: {}
          },
          {
            account: 'STOCK_GME',
            amount: '-100',
            text: 'Sold short -20 GME',
            extras: { asset: 'GME', assetChange: '-20' }
          }
        ],
        time: '2000-01-01T00:00:00.000Z',
      }
    })
  })


  it.only('short-selling with a little fee', async () => {

    const stock = {
      STOCK_GME: { GME: { value: 0, amount: 0 } }
    }
    const input = {
      type: 'sell' as UnifiedItemType,
      value: 100,
      assetOut: 'GME' as Asset,
      assetTypeOut: 'STOCK',
      assetAmountOut: 20,
      fee: 5,
    }

    const analyzer = await Analyzer.run(projectSettings, '2000-01-01T00:00:00Z' as Timestring, stock, input)

    expect(analyzer.toJSON()).toStrictEqual({
      balances: {
        CURRENCY_EUR: 95, STOCK_GME: -100, FEE_EUR: 5
      },
      stock: {
        STOCK_GME: { GME: { amount: -20, value: -100 } }
      },
      tx: {
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '95',
            text: 'Sold short -20 GME',
            extras: {}
          },
          {
            account: 'STOCK_GME',
            amount: '-100',
            text: 'Sold short -20 GME',
            extras: { asset: 'GME', assetChange: '-20' }
          },
          {
            account: 'FEE_EUR',
            amount: '5',
            text: 'Sold short -20 GME',
            extras: {}
          }
        ],
        time: '2000-01-01T00:00:00.000Z',
      }
    })
  })
})
