import { describe, expect, it } from 'vitest'
import { Analyzer } from '../../backend/src/lib/analyzer/Analyzer'
import { Asset, Timestring } from '@tasenor/common'
import { UnifiedItemType } from '../../backend/src/types/API/UnifiedItemData'

describe('Analyzer', () => {
  it('simple buying case', async () => {

    Analyzer.configure({
      currency: 'EUR',
      language: 'en'
    })

    const stock = {
      'ASSET_ETH': {'ETH': {'value': 5000, 'amount': 5.5}}
    }
    const input = {
      'type': 'buy' as UnifiedItemType,
      'value': 15000,
      'assetIn': 'ETH' as Asset,
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
              amount: -15000,
              text: 'Buy some ETH',
              extras: {}
            },
            {
              account: 'ASSET_ETH',
              amount: 15000,
              text: 'Buy some ETH',
              extras: { asset: 'ETH', assetChange: 5 }
            }
          ]
        },
        balances: { CURRENCY_EUR: -15000, ASSET_ETH: 15000 },
        stock: { ASSET_ETH: { ETH: { amount: 10.5, value: 20000 } } }
      }
    )
  })


  it('buying with default texts', async () => {

    Analyzer.configure({
      currency: 'EUR',
      language: 'fi'
    })

    const stock = {
      'ASSET_ETH': {'ETH': {'value': 5000, 'amount': 5.5}}
    }
    const input = {
      'type': 'buy' as UnifiedItemType,
      'value': 15000,
      'assetIn': 'ETH' as Asset,
      'assetAmountIn': 5
    }

    const analyzer = await Analyzer.run('2000-01-01T00:00:00Z' as Timestring, stock, input)

    expect(analyzer.toJSON()).toStrictEqual({
        tx: {
          time: '2000-01-01T00:00:00.000Z',
          lines: [
            {
              account: 'CURRENCY_EUR',
              amount: -15000,
              text: 'Ostettu +5 ETH',
              extras: {}
            },
            {
              account: 'ASSET_ETH',
              amount: 15000,
              text: 'Ostettu +5 ETH',
              extras: { asset: 'ETH', assetChange: 5 }
            }
          ]
        },
        balances: { CURRENCY_EUR: -15000, ASSET_ETH: 15000 },
        stock: { ASSET_ETH: { ETH: { amount: 10.5, value: 20000 } } }
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
              amount: -5000,
              text: 'Bought +5 ETH',
              extras: {}
            },
            {
              account: 'ASSET_ETH',
              amount: 5000,
              text: 'Bought +5 ETH',
              extras: { asset: 'ETH', assetChange: 5 }
            }
          ]
        },
        balances: { CURRENCY_EUR: -5000, ASSET_ETH: 5000 },
        stock: { ASSET_ETH: { ETH: { amount: 5, value: 5000 } } }
      }
    )
  })
})
