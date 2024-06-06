import { describe, expect, it } from 'vitest'
import { Analyzer } from '../../backend/src/lib/analyzer/Analyzer'
import { Asset, Timestring } from '@tasenor/common'
import { UnifiedItemType } from '../../backend/src/types/API/UnifiedItemData'
import { DateTime } from 'luxon'

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


  it('short-selling with a little fee', async () => {

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

  it('short-selling and buying back for the same price', async () => {

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

    const input2 = {
      type: 'buy' as UnifiedItemType,
      value: 100,
      assetIn: 'GME' as Asset,
      assetTypeIn: 'STOCK',
      assetAmountIn: 20,
    }

    const tx = await analyzer.analyze(DateTime.fromISO('2000-01-02T00:00:00Z'), input2)
    analyzer.apply(tx)

    expect(analyzer.toJSON()).toStrictEqual({
      tx: {
        time: '2000-01-02T00:00:00.000Z',
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '-100',
            text: 'Closing short position by buying +20 GME',
            extras: {}
          },
          {
            account: 'STOCK_GME',
            amount: '100',
            text: 'Closing short position by buying +20 GME',
            extras: { asset: 'GME', assetChange: '20' }
          }
        ]
      },
      balances: { CURRENCY_EUR: 0, STOCK_GME: 0 },
      stock: { STOCK_GME: { GME: { amount: 0, value: 0 } } }
    })
  })

  it.only('short-selling and buying back for profit', async () => {

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

    const input2 = {
      type: 'buy' as UnifiedItemType,
      value: 70,
      assetIn: 'GME' as Asset,
      assetTypeIn: 'STOCK',
      assetAmountIn: 20,
    }

    const tx = await analyzer.analyze(DateTime.fromISO('2000-01-02T00:00:00Z'), input2)
    analyzer.apply(tx)
    console.dir(analyzer.toJSON(), {depth: null})
  })
})
