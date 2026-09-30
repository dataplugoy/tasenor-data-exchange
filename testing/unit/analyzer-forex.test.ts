import { describe, expect, it } from 'vitest'
import { Timestring } from '@tasenor/common'
import { UnifiedItemData, UnifiedItemType } from '../../backend/src/types/API/UnifiedItemData'
import { runAnalyzer } from '../lib/unit-testing'

describe('Analyzer', () => {

  const projectSettings = { currency: 'EUR', language: 'en' }

  const lines = async (input: UnifiedItemData) => {
    const analyzer = await runAnalyzer(projectSettings, '2000-01-01T00:00:00Z' as Timestring, {}, input)
    const { tx, balances } = analyzer.toJSON(true) as { tx: { lines: { account: string, amount: string }[] }, balances: Record<string, string> }
    return { lines: tx.lines.map(l => `${l.account} ${l.amount}`), balances }
  }

  it('forex buying home currency with fee and profit', async () => {
    const { lines: result } = await lines({
      type: 'forex' as UnifiedItemType,
      value: 1080,
      valueAsset: 'USD',
      assetIn: 'EUR',
      assetAmountIn: 1000,
      fee: 2,
      feeAsset: 'EUR',
      profit: 1.5,
      rates: { USD: 0.925 },
    })
    expect(result).toStrictEqual([
      'CURRENCY_USD -997.5',
      'CURRENCY_EUR 999',
      'CURRENCY_EUR -2',
      'FEE_EUR 2',
      'FOREX_PROFIT -1.5',
    ])
  })

  it('forex selling home currency with loss', async () => {
    const { lines: result } = await lines({
      type: 'forex' as UnifiedItemType,
      value: 540,
      valueAsset: 'USD',
      assetOut: 'EUR',
      assetAmountOut: 500,
      profit: '-0.4',
      rates: { USD: 0.925 },
    })
    expect(result).toStrictEqual([
      'CURRENCY_USD 499.1',
      'CURRENCY_EUR -499.5',
      'FOREX_LOSS 0.4',
    ])
  })

  it('forex without profit', async () => {
    const { lines: result } = await lines({
      type: 'forex' as UnifiedItemType,
      value: 100,
      valueAsset: 'USD',
      assetOut: 'EUR',
      assetAmountOut: 90,
      rates: { USD: 0.9 },
    })
    expect(result).toStrictEqual([
      'CURRENCY_USD 90',
      'CURRENCY_EUR -90',
    ])
  })
})
