import { describe, expect, it } from 'vitest'
import { Timestring } from '@tasenor/common'
import { UnifiedItemData, UnifiedItemType } from '../../backend/src/types/API/UnifiedItemData'
import { runAnalyzer } from '../lib/unit-testing'
import { InitialStockData } from '../../backend/src/lib/Stock'

describe('Analyzer', () => {

  const projectSettings = { currency: 'EUR', language: 'en' }

  const run = async (stock: InitialStockData, input: UnifiedItemData) => {
    const analyzer = await runAnalyzer(projectSettings, '2000-01-01T00:00:00Z' as Timestring, stock, input)
    const { tx, stock: after } = analyzer.toJSON() as { tx: { lines: { account: string, amount: string, extras: { assetChange?: string } }[] }, stock: unknown }
    return {
      lines: tx.lines.map(l => `${l.account} ${l.amount}${l.extras.assetChange ? ` (${l.extras.assetChange})` : ''}`),
      stock: after,
    }
  }

  it('trade realizes loss of the given asset', async () => {
    const result = await run({ STOCK_OLD: { OLD: { value: 1000, amount: 100 } } }, {
      type: 'trade' as UnifiedItemType,
      value: 500,
      valueAsset: 'USD',
      rates: { USD: 0.9 },
      assetOut: 'OLD',
      assetAmountOut: 60,
      assetTypeOut: 'STOCK',
      assetIn: 'NEW',
      assetAmountIn: 30,
      assetTypeIn: 'STOCK',
      text: 'Merger',
    })
    expect(result.lines).toStrictEqual([
      'STOCK_OLD -600 (-60)',
      'STOCK_NEW 450 (30)',
      'LOSS_OLD 150',
    ])
    expect(result.stock).toStrictEqual({
      STOCK_OLD: { OLD: { amount: 40, value: 400 } },
      STOCK_NEW: { NEW: { amount: 30, value: 450 } },
    })
  })

  it('trade needs enough of the given asset', async () => {
    await expect(run({ STOCK_OLD: { OLD: { value: 1000, amount: 10 } } }, {
      type: 'trade' as UnifiedItemType,
      value: 500,
      assetOut: 'OLD',
      assetAmountOut: 60,
      assetTypeOut: 'STOCK',
      assetIn: 'NEW',
      assetAmountIn: 30,
      assetTypeIn: 'STOCK',
      text: 'Merger',
    })).rejects.toThrow('Cannot give 60 OLD when having only 10')
  })

  it('rename with ratio moves the average cost', async () => {
    const result = await run({ STOCK_STAR: { STAR: { value: 1150, amount: 575 } }, STOCK_SAFE: { SAFE: { value: 0, amount: 44 } } }, {
      type: 'rename' as UnifiedItemType,
      assetOut: 'STAR',
      assetAmountOut: 575,
      assetIn: 'SAFE',
      assetAmountIn: 92,
      assetTypeIn: 'STOCK',
      text: 'Split 4 for 25',
    })
    expect(result.lines).toStrictEqual([
      'STOCK_STAR -1150 (-575)',
      'STOCK_SAFE 1150 (92)',
    ])
    expect(result.stock).toStrictEqual({
      STOCK_STAR: { STAR: { amount: 0, value: 0 } },
      STOCK_SAFE: { SAFE: { amount: 136, value: 1150 } },
    })
  })

  it('income received as an asset', async () => {
    const result = await run({ STOCK_OUT: { OUT: { value: 300, amount: 100 } } }, {
      type: 'income' as UnifiedItemType,
      value: 20,
      valueAsset: 'USD',
      rates: { USD: 0.9 },
      account: 'INCOME_STOCK_DIVIDEND',
      reason: 'STOCK_DIVIDEND',
      text: 'Stock dividend',
      assetIn: 'OUT',
      assetAmountIn: 2,
      assetTypeIn: 'STOCK',
    })
    expect(result.lines).toStrictEqual([
      'STOCK_OUT 18 (2)',
      'INCOME_STOCK_DIVIDEND -18',
    ])
    expect(result.stock).toStrictEqual({
      STOCK_OUT: { OUT: { amount: 102, value: 318 } },
    })
  })

  it('spinoff enters at zero cost without money', async () => {
    const result = await run({}, {
      type: 'buy' as UnifiedItemType,
      value: 0,
      assetIn: 'STHO',
      assetAmountIn: 87.975,
      assetTypeIn: 'STOCK',
      text: 'Spinoff',
    })
    expect(result.lines).toStrictEqual([
      'STOCK_STHO 0 (87.975)',
    ])
  })
})
