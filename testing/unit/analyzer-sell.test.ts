import { describe, expect, it } from 'vitest'
import { Asset, Timestring } from '@tasenor/common'
import { UnifiedItemType } from '../../backend/src/types/API/UnifiedItemData'
import { JsonFileService } from '../../backend/src/lib/services/JsonFileService'
import { runAnalyzer } from '../lib/unit-testing'

describe('Analyzer', () => {

  const projectSettings = { currency: 'EUR', language: 'en' }

  it('sell for profit', async () => {

    const stock = {
      CRYPTO_ETH: { ETH: { value: 5000, amount: 5 } }
    }
    const input = {
      type: 'sell' as UnifiedItemType,
      value: 6000,
      assetOut: 'ETH' as Asset,
      assetTypeOut: 'CRYPTO',
      assetAmountOut: 5,
    }

    const analyzer = await runAnalyzer(projectSettings, '2000-01-01T00:00:00Z' as Timestring, stock, input)
    expect(analyzer.toJSON()).toStrictEqual({
      balances: {
        CRYPTO_ETH: -5000,
        CURRENCY_EUR: 6000,
        PROFIT_ETH: -1000,
      },
      stock: {
        CRYPTO_ETH: {
          ETH: {
            amount: 0,
            value: 0,
          },
        },
      },
      tx: {
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '6000',
            extras: {},
            text: 'Sold -5 ETH',
          },
          {
            account: 'CRYPTO_ETH',
            amount: '-5000',
            extras: {
              asset: 'ETH',
              assetChange: '-5',
            },
            text: 'Sold -5 ETH',
          },
          {
            account: 'PROFIT_ETH',
            amount: '-1000',
            extras: {},
            text: 'Sold -5 ETH',
          },
        ],
        time: '2000-01-01T00:00:00.000Z',
      }
    })
  })

  it('sell for loss', async () => {

    const stock = {
      CRYPTO_ETH: { ETH: { value: 5000, amount: 5 } }
    }
    const input = {
      type: 'sell' as UnifiedItemType,
      value: 4000,
      assetOut: 'ETH' as Asset,
      assetTypeOut: 'CRYPTO',
      assetAmountOut: 5,
      text: 'Sell some ETH'
    }

    const analyzer = await runAnalyzer(projectSettings, '2000-01-01T00:00:00Z' as Timestring, stock, input)
    expect(analyzer.toJSON()).toStrictEqual({
      balances: {
        CRYPTO_ETH: -5000,
        CURRENCY_EUR: 4000,
        LOSS_ETH: 1000,
      },
      stock: {
        CRYPTO_ETH: {
          ETH: {
            amount: 0,
            value: 0,
          },
        },
      },
      tx: {
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '4000',
            extras: {},
            text: 'Sell some ETH',
          },
          {
            account: 'CRYPTO_ETH',
            amount: '-5000',
            extras: {
              asset: 'ETH',
              assetChange: '-5',
            },
            text: 'Sell some ETH',
          },
          {
            account: 'LOSS_ETH',
            amount: '1000',
            extras: {},
            text: 'Sell some ETH',
          },
        ],
        time: '2000-01-01T00:00:00.000Z',
      },
    }
    )
  })

  it('sell for original price', async () => {

    const stock = {
      CRYPTO_ETH: { ETH: { value: 5000, amount: 5 } }
    }
    const input = {
      type: 'sell' as UnifiedItemType,
      value: 2000,
      assetOut: 'ETH' as Asset,
      assetTypeOut: 'CRYPTO',
      assetAmountOut: 2,
      text: 'Sell some ETH'
    }

    const analyzer = await runAnalyzer(projectSettings, '2000-01-01T00:00:00Z' as Timestring, stock, input)
    expect(analyzer.toJSON()).toStrictEqual({
      balances: {
        CRYPTO_ETH: -2000,
        CURRENCY_EUR: 2000,
      },
      stock: {
        CRYPTO_ETH: {
          ETH: {
            amount: 3,
            value: 3000,
          },
        },
      },
      tx: {
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '2000',
            extras: {},
            text: 'Sell some ETH',
          },
          {
            account: 'CRYPTO_ETH',
            amount: '-2000',
            extras: {
              asset: 'ETH',
              assetChange: '-2',
            },
            text: 'Sell some ETH',
          },
        ],
        time: '2000-01-01T00:00:00.000Z',
      },
    }
    )
  })

  it('sell for profit with a default currency fee', async () => {

    const stock = {
      CRYPTO_ETH: { ETH: { value: 5000, amount: 5 } }
    }
    const input = {
      type: 'sell' as UnifiedItemType,
      value: 6010,
      assetOut: 'ETH' as Asset,
      assetTypeOut: 'CRYPTO',
      assetAmountOut: 5,
      fee: 10,
    }

    const analyzer = await runAnalyzer(projectSettings, '2000-01-01T00:00:00Z' as Timestring, stock, input)

    expect(analyzer.toJSON()).toStrictEqual({
      balances: {
        CURRENCY_EUR: 6000,
        CRYPTO_ETH: -5000,
        PROFIT_ETH: -1010,
        FEE_EUR: 10
      },
      stock: {
        CRYPTO_ETH: {
          ETH: {
            amount: 0,
            value: 0,
          },
        },
      },
      tx: {
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '6000',
            text: 'Sold -5 ETH',
            extras: {}
          },
          {
            account: 'CRYPTO_ETH',
            amount: '-5000',
            text: 'Sold -5 ETH',
            extras: { asset: 'ETH', assetChange: '-5' }
          },
          {
            account: 'PROFIT_ETH',
            amount: '-1010',
            text: 'Sold -5 ETH',
            extras: {}
          },
          {
            account: 'FEE_EUR',
            amount: '10',
            text: 'Sold -5 ETH',
            extras: {}
          }
        ],
        time: '2000-01-01T00:00:00.000Z',
      }
    })
  })

  it('sell for loss with a default currency fee', async () => {

    const stock = {
      CRYPTO_ETH: { ETH: { value: 5000, amount: 5 } }
    }
    const input = {
      type: 'sell' as UnifiedItemType,
      value: 4010,
      assetOut: 'ETH' as Asset,
      assetTypeOut: 'CRYPTO',
      assetAmountOut: 5,
      fee: 10,
    }

    const analyzer = await runAnalyzer(projectSettings, '2000-01-01T00:00:00Z' as Timestring, stock, input)

    expect(analyzer.toJSON()).toStrictEqual({
      balances: { CURRENCY_EUR: 4000, CRYPTO_ETH: -5000, LOSS_ETH: 990, FEE_EUR: 10 },
      stock: {
        CRYPTO_ETH: {
          ETH: {
            amount: 0,
            value: 0,
          },
        },
      },
      tx: {
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '4000',
            text: 'Sold -5 ETH',
            extras: {}
          },
          {
            account: 'CRYPTO_ETH',
            amount: '-5000',
            text: 'Sold -5 ETH',
            extras: { asset: 'ETH', assetChange: '-5' }
          },
          {
            account: 'LOSS_ETH',
            amount: '990',
            text: 'Sold -5 ETH',
            extras: {}
          },
          {
            account: 'FEE_EUR',
            amount: '10',
            text: 'Sold -5 ETH',
            extras: {}
          }
        ],
        time: '2000-01-01T00:00:00.000Z',
      },
    }
    )
  })

  it('sell for original price with a default currency fee', async () => {

    const stock = {
      CRYPTO_ETH: { ETH: { value: 5000, amount: 5 } }
    }
    const input = {
      type: 'sell' as UnifiedItemType,
      value: 2000,
      assetOut: 'ETH' as Asset,
      assetTypeOut: 'CRYPTO',
      assetAmountOut: 2,
      fee: 10,
    }

    const analyzer = await runAnalyzer(projectSettings, '2000-01-01T00:00:00Z' as Timestring, stock, input)

    expect(analyzer.toJSON()).toStrictEqual({
      balances: { CURRENCY_EUR: 1990, CRYPTO_ETH: -2000, FEE_EUR: 10 },
      stock: { CRYPTO_ETH: { ETH: { amount: 3, value: 3000 } } },
      tx: {
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '1990',
            extras: {},
            text: 'Sold -2 ETH',
          },
          {
            account: 'CRYPTO_ETH',
            amount: '-2000',
            extras: {
              asset: 'ETH',
              assetChange: '-2',
            },
            text: 'Sold -2 ETH',
          },
          {
            account: 'FEE_EUR',
            amount: '10',
            text: 'Sold -2 ETH',
            extras: {}
          }
        ],
        time: '2000-01-01T00:00:00.000Z',
      },
    }
    )
  })

  // TODO: Test for various other fee cases: different currency, some asset.

  it('sell for loss in foreign currency', async () => {

    const stock = {
      STOCK_BIP: { BIP: { value: 1972.7988, amount: 50 } }
    }
    const input = {
      type: 'sell' as UnifiedItemType,
      value: 1813.5,
      valueAsset: 'USD' as Asset,
      rates: { USD: 0.96 },
      assetOut: 'BIP' as Asset,
      assetTypeOut: 'STOCK',
      assetAmountOut: 50,
    }

    const analyzer = await runAnalyzer(projectSettings, '2000-01-01T00:00:00Z' as Timestring, stock, input)
    expect(analyzer.toJSON()).toStrictEqual({
      balances: {
        CURRENCY_USD: 1740.96,
        LOSS_BIP: 231.8388,
        STOCK_BIP: -1972.7988,
      },
      stock: {
        STOCK_BIP: {
          BIP: {
            amount: 0,
            value: 0,
          },
        },
      },
      tx: {
        lines: [
          {
            account: 'CURRENCY_USD',
            amount: '1740.96',
            extras: {},
            text: 'Sold -50 BIP',
          },
          {
            account: 'STOCK_BIP',
            amount: '-1972.7988',
            extras: {
              asset: 'BIP',
              assetChange: '-50',
            },
            text: 'Sold -50 BIP',
          },
          {
            account: 'LOSS_BIP',
            amount: '231.8388',
            extras: {},
            text: 'Sold -50 BIP',
          },
        ],
        time: '2000-01-01T00:00:00.000Z',
      },
    })
  })

  it('sell in foreign currency using rates from the service', async () => {

    const stock = {
      STOCK_BIP: { BIP: { value: 1972.7988, amount: 50 } }
    }
    const input = {
      type: 'sell' as UnifiedItemType,
      value: 1813.5,
      valueAsset: 'USD' as Asset,
      assetOut: 'BIP' as Asset,
      assetTypeOut: 'STOCK',
      assetAmountOut: 50,
    }

    const services = [
      new JsonFileService({ url: 'file:///rates.json' })
    ]

    const analyzer = await runAnalyzer(projectSettings, '2000-01-01T00:00:00Z' as Timestring, stock, input, { userId: 0 }, null, services)
    expect(analyzer.toJSON()).toStrictEqual({
      balances: {
        CURRENCY_USD: 1632.15,
        LOSS_BIP: 340.6488,
        STOCK_BIP: -1972.7988,
      },
      stock: {
        STOCK_BIP: {
          BIP: {
            amount: 0,
            value: 0,
          },
        },
      },
      tx: {
        lines: [
          {
            account: 'CURRENCY_USD',
            amount: '1632.15',
            extras: {},
            text: 'Sold -50 BIP',
          },
          {
            account: 'STOCK_BIP',
            amount: '-1972.7988',
            extras: {
              asset: 'BIP',
              assetChange: '-50',
            },
            text: 'Sold -50 BIP',
          },
          {
            account: 'LOSS_BIP',
            amount: '340.6488',
            extras: {},
            text: 'Sold -50 BIP',
          },
        ],
        time: '2000-01-01T00:00:00.000Z',
      },
    })
  })
})
