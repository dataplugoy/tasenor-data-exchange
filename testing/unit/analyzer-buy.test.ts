import { describe, expect, it } from 'vitest'
import { Analyzer } from '../../backend/src/lib/analyzer/Analyzer'
import { Asset, Timestring } from '@tasenor/common'
import { UnifiedItemType } from '../../backend/src/types/API/UnifiedItemData'
import { JsonFileService } from '../../backend/src/lib/services/JsonFileService'

describe('Analyzer', () => {
  it('simple buying case', async () => {

    Analyzer.configure({
      currency: 'EUR',
      language: 'en'
    })

    const stock = {
      'CRYPTO_ETH': {'ETH': {'value': 5000, 'amount': 5.5}}
    }
    const input = {
      'type': 'buy' as UnifiedItemType,
      'value': 15000,
      'assetIn': 'ETH' as Asset,
      'assetTypeIn': 'CRYPTO',
      'assetAmountIn': 5,
      'text': 'Buy some ETH'
    }

    const analyzer = await Analyzer.run('2000-01-01T00:00:00Z' as Timestring, stock, input)

    expect(analyzer.toJSON()).toStrictEqual({
        tx: {
          time: '2000-01-01T00:00:00.000Z',
          lines: [
            {
              account: 'CURRENCY_EUR',
              amount: "-15000",
              text: 'Buy some ETH',
              extras: {}
            },
            {
              account: 'CRYPTO_ETH',
              amount: "15000",
              text: 'Buy some ETH',
              extras: { asset: 'ETH', assetChange: "5" }
            }
          ]
        },
        balances: { CURRENCY_EUR: -15000, CRYPTO_ETH: 15000 },
        stock: { CRYPTO_ETH: { ETH: { amount: 10.5, value: 20000 } } }
      }
    )
  })


  it('buying with default texts', async () => {

    Analyzer.configure({
      currency: 'EUR',
      language: 'fi'
    })

    const stock = {
      'CRYPTO_ETH': {'ETH': {'value': 5000, 'amount': 5.5}}
    }
    const input = {
      'type': 'buy' as UnifiedItemType,
      'value': 15000,
      'assetIn': 'ETH' as Asset,
      'assetTypeIn': 'CRYPTO',
      'assetAmountIn': 5
    }

    const analyzer = await Analyzer.run('2000-01-01T00:00:00Z' as Timestring, stock, input)

    expect(analyzer.toJSON()).toStrictEqual({
        tx: {
          time: '2000-01-01T00:00:00.000Z',
          lines: [
            {
              account: 'CURRENCY_EUR',
              amount: "-15000",
              text: 'Ostettu +5 ETH',
              extras: {}
            },
            {
              account: 'CRYPTO_ETH',
              amount: "15000",
              text: 'Ostettu +5 ETH',
              extras: { asset: 'ETH', assetChange: "5" }
            }
          ]
        },
        balances: { CURRENCY_EUR: -15000, CRYPTO_ETH: 15000 },
        stock: { CRYPTO_ETH: { ETH: { amount: 10.5, value: 20000 } } }
      }
    )
  })


  it('buying with implicit value in extras', async () => {

    Analyzer.configure({
      currency: 'EUR',
      language: 'en'
    })

    const stock = {
    }
    const input = {
      'type': 'buy' as UnifiedItemType,
      'assetIn': 'ETH' as Asset,
      'assetTypeIn': 'CRYPTO',
      'assetAmountIn': 5,
      'rates': {
        'ETH': 1000
      }
    }

    const analyzer = await Analyzer.run('2000-01-01T00:00:00Z' as Timestring, stock, input)

    expect(analyzer.toJSON()).toStrictEqual({
        tx: {
          time: '2000-01-01T00:00:00.000Z',
          lines: [
            {
              account: 'CURRENCY_EUR',
              amount: "-5000",
              text: 'Bought +5 ETH',
              extras: {}
            },
            {
              account: 'CRYPTO_ETH',
              amount: "5000",
              text: 'Bought +5 ETH',
              extras: { asset: 'ETH', assetChange: "5" }
            }
          ]
        },
        balances: { CURRENCY_EUR: -5000, CRYPTO_ETH: 5000 },
        stock: { CRYPTO_ETH: { ETH: { amount: 5, value: 5000 } } }
      }
    )
  })


  it('buying using rates from the service', async () => {
    Analyzer.configure({
      currency: 'EUR',
      language: 'en'
    })

    const stock = {
    }
    const input = {
      'type': 'buy' as UnifiedItemType,
      'assetIn': 'BTC' as Asset,
      'assetTypeIn': 'CRYPTO',
      'assetAmountIn': 1.1,
    }

    const services = [
      new JsonFileService({ url: 'file:///rates.json' })
    ]

    const analyzer = await Analyzer.run('2000-01-01T00:00:00Z' as Timestring, stock, input, services)

    expect(analyzer.toJSON()).toStrictEqual({
        tx: {
          time: '2000-01-01T00:00:00.000Z',
          lines: [
            {
              account: 'CURRENCY_EUR',
              amount: "-55000",
              text: 'Bought +1.1 BTC',
              extras: {}
            },
            {
              account: 'CRYPTO_BTC',
              amount: "55000",
              text: 'Bought +1.1 BTC',
              extras: { asset: 'BTC', assetChange: "1.1" }
            }
          ]
        },
        balances: { CURRENCY_EUR: -55000, CRYPTO_BTC: 55000 },
        stock: { CRYPTO_BTC: { BTC: { amount: 1.1, value: 55000 } } }
      }
    )
  })


  it('buying with fee in default currency', async () => {
    Analyzer.configure({
      currency: 'EUR',
      language: 'en'
    })

    const stock = {
    }
    const input = {
      'type': 'buy' as UnifiedItemType,
      'value': 1000,
      'assetIn': 'NORDEA' as Asset,
      'assetTypeIn': 'STOCK',
      'assetAmountIn': 1,
      'fee': 2
    }

    const services = [
    ]

    const analyzer = await Analyzer.run('2000-01-01T00:00:00Z' as Timestring, stock, input, services)

    expect(analyzer.toJSON()).toStrictEqual({
        tx: {
          time: '2000-01-01T00:00:00.000Z',
          lines: [
            {
              account: 'CURRENCY_EUR',
              amount: '-1000',
              text: 'Bought +1 NORDEA',
              extras: {}
            },
            {
              account: 'STOCK_NORDEA',
              amount: '998',
              text: 'Bought +1 NORDEA',
              extras: { asset: 'NORDEA', assetChange: '1' }
            },
            {
              account: 'FEE_EUR',
              amount: '2',
              text: 'Bought +1 NORDEA',
              extras: { }
            }
          ]
        },
        balances: { CURRENCY_EUR: -1000, STOCK_NORDEA: 998, FEE_EUR: 2 },
        stock: { STOCK_NORDEA: { NORDEA: { amount: 1, value: 998 } } }
      }
    )
  })


  it('buying with fee in some other currency', async () => {
    Analyzer.configure({
      currency: 'EUR',
      language: 'en'
    })

    const stock = {
    }
    const input = {
      'type': 'buy' as UnifiedItemType,
      'value': 5000,
      'assetIn': 'BTC' as Asset,
      'assetTypeIn': 'CRYPTO',
      'assetAmountIn': 0.1,
      'fee': 2,
      'feeAsset': 'USD'
    }

    const services = [
      new JsonFileService({ url: 'file:///rates.json' })
    ]

    const analyzer = await Analyzer.run('2000-01-01T00:00:00Z' as Timestring, stock, input, services)

    expect(analyzer.toJSON()).toStrictEqual({
        tx: {
          time: '2000-01-01T00:00:00.000Z',
          lines: [
            {
              account: 'CURRENCY_EUR',
              amount: '-5000',
              text: 'Bought +0.1 BTC',
              extras: {}
            },
            {
              account: 'CRYPTO_BTC',
              amount: '4998.2',
              text: 'Bought +0.1 BTC',
              extras: { asset: 'BTC', assetChange: '0.1' }
            },
            {
              account: 'FEE_USD',
              amount: '1.8',
              text: 'Bought +0.1 BTC',
              extras: {}
            }
          ]
        },
        balances: { CURRENCY_EUR: -5000, CRYPTO_BTC: 4998.2, FEE_USD: 1.8 },
        stock: { CRYPTO_BTC: { BTC: { amount: 0.1, value: 4998.2 } } }
      }
    )
  })


  it('buying with fee in assets', async () => {
    Analyzer.configure({
      currency: 'EUR',
      language: 'en'
    })

    const stock = {
    }
    const input = {
      'type': 'buy' as UnifiedItemType,
      'value': 1000,
      'assetIn': 'NORDEA' as Asset,
      'assetTypeIn': 'STOCK',
      'assetAmountIn': 1,
      'fee': 2,
      'feeAsset': 'ETH'
    }

    const services = [
      new JsonFileService({ url: 'file:///rates.json' })
    ]

    const analyzer = await Analyzer.run('2000-01-01T00:00:00Z' as Timestring, stock, input, services)

    expect(analyzer.toJSON()).toStrictEqual({
        tx: {
          time: '2000-01-01T00:00:00.000Z',
          lines: [
            {
              account: 'CURRENCY_EUR',
              amount: '-1000',
              text: 'Bought +1 NORDEA',
              extras: {}
            },
            {
              account: 'STOCK_NORDEA',
              amount: '-1000',
              text: 'Bought +1 NORDEA',
              extras: { asset: 'NORDEA', assetChange: '1' }
            },
            {
              account: 'CRYPTOFEE_ETH',
              amount: '2000',
              text: 'Bought +1 NORDEA',
              extras: { asset: 'ETH', assetChange: '-2' }
            }
          ]
        },
        balances: { CURRENCY_EUR: -1000, STOCK_NORDEA: -1000, CRYPTOFEE_ETH: 2000 },
        stock: {
          STOCK_NORDEA: { NORDEA: { amount: 1, value: -1000 } },
          CRYPTOFEE_ETH: { ETH: { amount: -2, value: 2000 } }
        }
      }
    )
  })
})
