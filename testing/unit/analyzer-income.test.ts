import { describe, expect, it } from 'vitest'
import { Timestring } from '@tasenor/common'
import { UnifiedItemType } from '../../backend/src/types/API/UnifiedItemData'
import { runAnalyzer } from '../lib/unit-testing'

describe('Analyzer', () => {
  const projectSettings = { currency: 'EUR', language: 'en' }

  it('income case', async () => {

    const stock = {
    }
    const input = {
      type: 'income' as UnifiedItemType,
      value: 5,
      reasonAsset: 'FOO',
      reason: 'DIVIDEND',
    }

    const analyzer = await runAnalyzer(projectSettings, '2000-01-01T00:00:00Z' as Timestring, stock, input)

    expect(analyzer.toJSON()).toStrictEqual({
      tx: {
        time: '2000-01-01T00:00:00.000Z',
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '5',
            text: 'Dividend for FOO',
            extras: {}
          },
          {
            account: 'INCOME_DIVIDEND',
            amount: '-5',
            text: 'Dividend for FOO',
            extras: {}
          }
        ]
      },
      balances: { CURRENCY_EUR: 5, INCOME_DIVIDEND: -5 },
      stock: {}
    }
    )
  })

})
