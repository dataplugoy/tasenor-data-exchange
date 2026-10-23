import { describe, expect, test } from 'vitest'
import { Timestring } from '@tasenor/common'
import { Analyzer } from '../../backend/src/lib/analyzer/Analyzer'
import { Stock } from '../../backend/src/lib/Stock'
import { UnifiedItemData } from '../../backend/src/types/API/UnifiedItemData'
import { BalanceData } from '../../backend/src/types/API/BalanceData'
import { continueAnalyzer } from '../lib/unit-testing'

describe('Analyzer debt split', () => {

  const projectSettings = { currency: 'EUR', language: 'en' }
  const setup = { settings: { debtAccounts: { EUR: '999', USD: '998' } } }
  const analyze = async (balances: BalanceData, input: UnifiedItemData) => {
    const analyzer = new Analyzer(projectSettings, new Stock({}), balances, setup)
    const tx = await continueAnalyzer(analyzer, '2000-01-01T00:00:00Z' as Timestring, input)
    analyzer.apply(tx)
    return [tx.lines.map(line => [line.account, line.amount]), analyzer.toJSON().balances]
  }

  test('taking debt in one currency and paying back debt in another in the same transaction', async () => {
    const [lines, balances] = await analyze({ CURRENCY_EUR: 100, DEBT_CURRENCY_USD: -50 }, {
      type: 'forex', assetIn: 'USD', assetAmountIn: 200, valueAsset: 'EUR', value: 150
    } as UnifiedItemData)
    expect(lines).toStrictEqual([
      ['CURRENCY_EUR', '-100'],
      ['CURRENCY_USD', '100'],
      ['DEBT_CURRENCY_EUR', '-50'],
      ['DEBT_CURRENCY_USD', '50'],
    ])
    expect(balances).toStrictEqual({ CURRENCY_EUR: 0, CURRENCY_USD: 100, DEBT_CURRENCY_EUR: -50, DEBT_CURRENCY_USD: 0 })
  })

  test('a fee after spending all cash goes to the debt', async () => {
    const [lines, balances] = await analyze({ CURRENCY_EUR: 100 }, {
      type: 'forex', assetIn: 'USD', assetAmountIn: 120, valueAsset: 'EUR', value: 100, fee: 1
    } as UnifiedItemData)
    expect(lines).toStrictEqual([
      ['CURRENCY_EUR', '-100'],
      ['CURRENCY_USD', '100'],
      ['DEBT_CURRENCY_EUR', '-1'],
      ['FEE_EUR', '1'],
    ])
    expect(balances).toStrictEqual({ CURRENCY_EUR: 0, CURRENCY_USD: 100, DEBT_CURRENCY_EUR: -1, FEE_EUR: 1 })
  })
})
