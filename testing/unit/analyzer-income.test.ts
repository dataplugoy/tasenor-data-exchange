import { describe, expect, it } from 'vitest'
import { Analyzer } from '../../backend/src/lib/analyzer/Analyzer'
import { Timestring } from '@tasenor/common'
import { UnifiedItemType } from '../../backend/src/types/API/UnifiedItemData'

describe('Analyzer', () => {
  it('income case', async () => {

    Analyzer.configure({
      currency: 'EUR',
      language: 'en'
    })

    const stock = {
    }
    const input = {
      type: 'income' as UnifiedItemType,
      value: 5,
      reasonAsset: 'FOO',
      reason: 'DIVIDEND',
    }

    const analyzer = await Analyzer.run('2000-01-01T00:00:00Z' as Timestring, stock, input)

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
