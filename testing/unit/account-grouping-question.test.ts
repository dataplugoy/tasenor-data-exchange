import { describe, expect, it } from 'vitest'
import { Asset, Timestring } from '@tasenor/common'
import { UnifiedItemType } from '../../backend/src/types/API/UnifiedItemData'
import { runAnalyzer } from '../lib/unit-testing'
import { AnswersRequired } from '../../backend/src/exceptions/AnswersRequired'

describe('Account grouping questions', () => {

  const projectSettings = { currency: 'EUR', language: 'en' }
  const stock = {
    CRYPTO_ETH: { ETH: { value: 5000, amount: 5 } }
  }
  const input = {
    type: 'sell' as UnifiedItemType,
    value: 6000,
    assetOut: 'ETH' as Asset,
    assetTypeOut: 'CRYPTO',
    assetAmountOut: 5,
    fee: 10,
  }
  const options = { userId: 0, flowPlanId: 1, interactive: true }

  it('asks grouping of profits and fees in an interactive run', async () => {
    const err = await runAnalyzer(projectSettings, '2000-01-01T00:00:00Z' as Timestring, stock, input, options, { settings: {} }).catch(err => err)
    expect(err).toBeInstanceOf(AnswersRequired)
    expect(err.payload.map(q => [q.type, q.variable])).toStrictEqual([
      ['BOOLEAN', 'accountGrouping.singleProfitAccount'],
      ['BOOLEAN', 'accountGrouping.singleFeeAccount'],
    ])
  })

  it('does not ask grouping already answered', async () => {
    const setup = { settings: {}, accountGrouping: { singleProfitAccount: true, singleFeeAccount: false } }
    const analyzer = await runAnalyzer(projectSettings, '2000-01-01T00:00:00Z' as Timestring, stock, input, options, setup)
    expect(analyzer.toJSON().tx.lines.map(line => line.account)).toStrictEqual(['CURRENCY_EUR', 'CRYPTO_ETH', 'PROFIT', 'FEE_EUR'])
  })

  it('does not ask grouping in a non-interactive run', async () => {
    const analyzer = await runAnalyzer(projectSettings, '2000-01-01T00:00:00Z' as Timestring, stock, input, { userId: 0 }, { settings: {} })
    expect(analyzer.toJSON().tx.lines.map(line => line.account)).toStrictEqual(['CURRENCY_EUR', 'CRYPTO_ETH', 'PROFIT_ETH', 'FEE_EUR'])
  })
})
