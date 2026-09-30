import { describe, expect, it } from 'vitest'
import { continueAnalyzer, runAnalyzer } from '../lib/unit-testing'
import { Asset, Timestring } from '@tasenor/common'
import { UnifiedItemType } from '../../backend/src/types/API/UnifiedItemData'
import { Setup } from '../../backend/src/types/API/Setup'

describe('Analyzer', () => {

  const projectSettings = { currency: 'EUR', language: 'en' }
  const setup: Setup = {
    settings: {
      allowShortSelling: true,
      debtAccounts: {
        EUR: null
      }
    }
  }

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

    const analyzer = await runAnalyzer(projectSettings, '2000-01-01T00:00:00Z' as Timestring, stock, input, { userId: 0 }, setup)

    expect(analyzer.toJSON()).toStrictEqual({
      balances: {
        CURRENCY_EUR: 100, STOCK_GME: -100,
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

    const analyzer = await runAnalyzer(projectSettings, '2000-01-01T00:00:00Z' as Timestring, stock, input, { userId: 0 }, setup)

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

    const analyzer = await runAnalyzer(projectSettings, '2000-01-01T00:00:00Z' as Timestring, stock, input, { userId: 0 }, setup)

    const input2 = {
      type: 'buy' as UnifiedItemType,
      value: 100,
      assetIn: 'GME' as Asset,
      assetTypeIn: 'STOCK',
      assetAmountIn: 20,
    }

    const tx = await continueAnalyzer(analyzer, '2000-01-02T00:00:00Z', input2)
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

  it('short-selling and buying back for profit', async () => {

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

    const analyzer = await runAnalyzer(projectSettings, '2000-01-01T00:00:00Z' as Timestring, stock, input, { userId: 0 }, setup)

    const input2 = {
      type: 'buy' as UnifiedItemType,
      value: 70,
      assetIn: 'GME' as Asset,
      assetTypeIn: 'STOCK',
      assetAmountIn: 20,
    }

    const tx = await continueAnalyzer(analyzer, '2000-01-02T00:00:00Z', input2)
    analyzer.apply(tx)

    expect(analyzer.toJSON()).toStrictEqual({
      tx: {
        time: '2000-01-02T00:00:00.000Z',
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '-70',
            text: 'Closing short position by buying +20 GME',
            extras: {}
          },
          {
            account: 'STOCK_GME',
            amount: '100',
            text: 'Closing short position by buying +20 GME',
            extras: { asset: 'GME', assetChange: '20' }
          },
          {
            account: 'PROFIT_GME',
            amount: '-30',
            extras: {},
            text: 'Closing short position by buying +20 GME',
          },
        ]
      },
      balances: { CURRENCY_EUR: 30, STOCK_GME: 0, PROFIT_GME: -30 },
      stock: { STOCK_GME: { GME: { amount: 0, value: 0 } } }
    })
  })

  it('short-selling and buying back with losses', async () => {

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

    const analyzer = await runAnalyzer(projectSettings, '2000-01-01T00:00:00Z' as Timestring, stock, input, { userId: 0 }, setup)

    const input2 = {
      type: 'buy' as UnifiedItemType,
      value: 110,
      assetIn: 'GME' as Asset,
      assetTypeIn: 'STOCK',
      assetAmountIn: 20,
    }

    const tx = await continueAnalyzer(analyzer, '2000-01-02T00:00:00Z', input2)
    analyzer.apply(tx)

    expect(analyzer.toJSON()).toStrictEqual({
      tx: {
        time: '2000-01-02T00:00:00.000Z',
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '-110',
            text: 'Closing short position by buying +20 GME',
            extras: {}
          },
          {
            account: 'STOCK_GME',
            amount: '100',
            text: 'Closing short position by buying +20 GME',
            extras: { asset: 'GME', assetChange: '20' }
          },
          {
            account: 'LOSS_GME',
            amount: '10',
            text: 'Closing short position by buying +20 GME',
            extras: {}
          }
        ]
      },
      balances: { CURRENCY_EUR: -10, STOCK_GME: 0, LOSS_GME: 10 },
      stock: { STOCK_GME: { GME: { amount: 0, value: 0 } } }
    })
  })

  it('short-selling and buying back for the same price with a little fee', async () => {

    const stock = {
      STOCK_GME: { GME: { value: 0, amount: 0 } }
    }
    const input = {
      type: 'sell' as UnifiedItemType,
      value: 100,
      assetOut: 'GME' as Asset,
      assetTypeOut: 'STOCK',
      assetAmountOut: 20,
      fee: 2.5,
    }

    const analyzer = await runAnalyzer(projectSettings, '2000-01-01T00:00:00Z' as Timestring, stock, input, { userId: 0 }, setup)

    const input2 = {
      type: 'buy' as UnifiedItemType,
      value: 102.5,
      assetIn: 'GME' as Asset,
      assetTypeIn: 'STOCK',
      assetAmountIn: 20,
      fee: 2.5,
    }

    const tx = await continueAnalyzer(analyzer, '2000-01-02T00:00:00Z', input2)
    analyzer.apply(tx)

    expect(analyzer.toJSON()).toStrictEqual({
      tx: {
        time: '2000-01-02T00:00:00.000Z',
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '-102.5',
            text: 'Closing short position by buying +20 GME',
            extras: {}
          },
          {
            account: 'STOCK_GME',
            amount: '100',
            text: 'Closing short position by buying +20 GME',
            extras: { asset: 'GME', assetChange: '20' }
          },
          {
            account: 'FEE_EUR',
            amount: '2.5',
            text: 'Closing short position by buying +20 GME',
            extras: {}
          }
        ]
      },
      balances: { CURRENCY_EUR: -5, STOCK_GME: 0, FEE_EUR: 5 },
      stock: { STOCK_GME: { GME: { amount: 0, value: 0 } } }
    })
  })

  it('short-selling and buying back for profit but with a fee', async () => {

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

    const analyzer = await runAnalyzer(projectSettings, '2000-01-01T00:00:00Z' as Timestring, stock, input, { userId: 0 }, setup)

    const input2 = {
      type: 'buy' as UnifiedItemType,
      value: 75,
      assetIn: 'GME' as Asset,
      assetTypeIn: 'STOCK',
      assetAmountIn: 20,
      fee: 5,
    }

    const tx = await continueAnalyzer(analyzer, '2000-01-02T00:00:00Z', input2)
    analyzer.apply(tx)

    expect(analyzer.toJSON()).toStrictEqual({
      tx: {
        time: '2000-01-02T00:00:00.000Z',
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '-75',
            text: 'Closing short position by buying +20 GME',
            extras: {}
          },
          {
            account: 'STOCK_GME',
            amount: '100',
            text: 'Closing short position by buying +20 GME',
            extras: { asset: 'GME', assetChange: '20' }
          },
          {
            account: 'PROFIT_GME',
            amount: '-30',
            extras: {},
            text: 'Closing short position by buying +20 GME',
          },
          {
            account: 'FEE_EUR',
            amount: '5',
            text: 'Closing short position by buying +20 GME',
            extras: {}
          }
        ]
      },
      balances: { CURRENCY_EUR: 25, STOCK_GME: 0, PROFIT_GME: -30, FEE_EUR: 5 },
      stock: { STOCK_GME: { GME: { amount: 0, value: 0 } } }
    })
  })

  it('short-selling and buying back with losses and also paying fee', async () => {

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

    const analyzer = await runAnalyzer(projectSettings, '2000-01-01T00:00:00Z' as Timestring, stock, input, { userId: 0 }, setup)

    const input2 = {
      type: 'buy' as UnifiedItemType,
      value: 115,
      assetIn: 'GME' as Asset,
      assetTypeIn: 'STOCK',
      assetAmountIn: 20,
      fee: 5,
    }

    const tx = await continueAnalyzer(analyzer, '2000-01-02T00:00:00Z', input2)
    analyzer.apply(tx)

    expect(analyzer.toJSON()).toStrictEqual({
      tx: {
        time: '2000-01-02T00:00:00.000Z',
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '-115',
            text: 'Closing short position by buying +20 GME',
            extras: {}
          },
          {
            account: 'STOCK_GME',
            amount: '100',
            text: 'Closing short position by buying +20 GME',
            extras: { asset: 'GME', assetChange: '20' }
          },
          {
            account: 'LOSS_GME',
            amount: '10',
            text: 'Closing short position by buying +20 GME',
            extras: {}
          },
          {
            account: 'FEE_EUR',
            amount: '5',
            text: 'Closing short position by buying +20 GME',
            extras: {}
          }
        ]
      },
      balances: { CURRENCY_EUR: -15, STOCK_GME: 0, LOSS_GME: 10, FEE_EUR: 5 },
      stock: { STOCK_GME: { GME: { amount: 0, value: 0 } } }
    })
  })

  it('short-selling and buying back with a single stock account', async () => {

    const grouped: Setup = { ...setup, accountGrouping: { singleStockAccount: true } }
    const input = {
      type: 'sell' as UnifiedItemType,
      value: 100,
      assetOut: 'GME' as Asset,
      assetTypeOut: 'STOCK',
      assetAmountOut: 20,
    }
    const analyzer = await runAnalyzer(projectSettings, '2000-01-01T00:00:00Z' as Timestring, {}, input, { userId: 0 }, grouped)

    const tx = await continueAnalyzer(analyzer, '2000-01-02T00:00:00Z', {
      type: 'buy' as UnifiedItemType,
      value: 70,
      assetIn: 'GME' as Asset,
      assetTypeIn: 'STOCK',
      assetAmountIn: 20,
    })
    analyzer.apply(tx)

    expect(tx.lines.map(l => `${l.account} ${l.amount}`)).toStrictEqual([
      'CURRENCY_EUR -70',
      'STOCK 100',
      'PROFIT_GME -30',
    ])
    expect(analyzer.toJSON().stock).toStrictEqual({ STOCK: { GME: { amount: 0, value: 0 } } })
  })
})
