import { describe, expect, it } from 'vitest'
import { Analyzer } from '../../backend/src/lib/analyzer/Analyzer'
import { Asset, Timestring } from '@tasenor/common'
import { UnifiedItemType } from '../../backend/src/types/API/UnifiedItemData'

describe('Analyzer', () => {
  it('sell for profit', async () => {

    Analyzer.configure({
      currency: 'EUR',
      language: 'en'
    })

    const stock = {
      'ASSET_ETH': {'ETH': {'value': 5000, 'amount': 5}}
    }
    const input = {
      'type': 'sell' as UnifiedItemType,
      'value': 6000,
      'assetOut': 'ETH' as Asset,
      'assetAmountOut': 5,
    }

    const analyzer = await Analyzer.run('2000-01-01T00:00:00Z' as Timestring, stock, input)
    expect(analyzer.toJSON()).toStrictEqual({
      "balances": {
        "ASSET_ETH": -5000,
        "CURRENCY_EUR": 6000,
        "PROFIT_ETH": -1000,
      },
      "stock": {
        "ASSET_ETH": {
          "ETH": {
            "amount": 0,
            "value": 0,
          },
        },
      },
      "tx": {
        "lines": [
          {
            "account": "CURRENCY_EUR",
            "amount": "6000",
            "extras": {},
            "text": "Sold -5 ETH",
          },
          {
            "account": "ASSET_ETH",
            "amount": "-5000",
            "extras": {
              "asset": "ETH",
              "assetChange": "-5",
            },
            "text": "Sold -5 ETH",
          },
          {
            "account": "PROFIT_ETH",
            "amount": "-1000",
            "extras": {},
            "text": "Sold -5 ETH",
          },
        ],
        "time": "2000-01-01T00:00:00.000Z",
      }
    })
  })

  it('sell for loss', async () => {

    Analyzer.configure({
      currency: 'EUR',
      language: 'en'
    })

    const stock = {
      'ASSET_ETH': {'ETH': {'value': 5000, 'amount': 5}}
    }
    const input = {
      'type': 'sell' as UnifiedItemType,
      'value': 4000,
      'assetOut': 'ETH' as Asset,
      'assetAmountOut': 5,
      'text': 'Sell some ETH'
    }

    const analyzer = await Analyzer.run('2000-01-01T00:00:00Z' as Timestring, stock, input)
    expect(analyzer.toJSON()).toStrictEqual({
      "balances": {
          "ASSET_ETH": -5000,
          "CURRENCY_EUR": 4000,
          "LOSS_ETH": 1000,
        },
        "stock": {
          "ASSET_ETH": {
            "ETH": {
              "amount": 0,
              "value": 0,
            },
          },
        },
        "tx": {
          "lines": [
            {
              "account": "CURRENCY_EUR",
              "amount": "4000",
              "extras": {},
              "text": "Sell some ETH",
            },
            {
              "account": "ASSET_ETH",
              "amount": "-5000",
              "extras": {
                "asset": "ETH",
                "assetChange": "-5",
              },
              "text": "Sell some ETH",
            },
            {
              "account": "LOSS_ETH",
              "amount": "1000",
              "extras": {},
              "text": "Sell some ETH",
            },
          ],
          "time": "2000-01-01T00:00:00.000Z",
        },
      }
    )
  })

  it('sell for original price', async () => {

    Analyzer.configure({
      currency: 'EUR',
      language: 'en'
    })

    const stock = {
      'ASSET_ETH': {'ETH': {'value': 5000, 'amount': 5}}
    }
    const input = {
      'type': 'sell' as UnifiedItemType,
      'value': 2000,
      'assetOut': 'ETH' as Asset,
      'assetAmountOut': 2,
      'text': 'Sell some ETH'
    }

    const analyzer = await Analyzer.run('2000-01-01T00:00:00Z' as Timestring, stock, input)
    expect(analyzer.toJSON()).toStrictEqual({
      "balances": {
          "ASSET_ETH": -2000,
          "CURRENCY_EUR": 2000,
        },
        "stock": {
          "ASSET_ETH": {
            "ETH": {
              "amount": 3,
              "value": 3000,
            },
          },
        },
        "tx": {
          "lines": [
            {
              "account": "CURRENCY_EUR",
              "amount": "2000",
              "extras": {},
              "text": "Sell some ETH",
            },
            {
              "account": "ASSET_ETH",
              "amount": "-2000",
              "extras": {
                "asset": "ETH",
                "assetChange": "-2",
              },
              "text": "Sell some ETH",
            },
          ],
          "time": "2000-01-01T00:00:00.000Z",
        },
      }
    )
  })
})
