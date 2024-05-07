import { describe, expect, it } from 'vitest'
import { Analyzer } from '../../backend/src/lib/analyzer/Analyzer'
import { Timestring } from '@tasenor/common'
import { UnifiedItemType } from '../../backend/src/types/API/UnifiedItemData'

describe('Analyzer', () => {

  const projectSettings = { currency: 'EUR', language: 'en' }

  it('expense case', async () => {

    const stock = {
    }
    const input = {
      type: 'expense' as UnifiedItemType,
      value: 950,
      account: 'EXPENSE_RANDOM',
      text: 'Random fee',
    }

    const analyzer = await Analyzer.run(projectSettings, '2000-01-01T00:00:00Z' as Timestring, stock, input)

    expect(analyzer.toJSON()).toStrictEqual({
        tx: {
          time: '2000-01-01T00:00:00.000Z',
          lines: [
            {
              account: 'CURRENCY_EUR',
              amount: '-950',
              extras: {},
              text: 'Random fee',
            },
            {
              account: 'EXPENSE_RANDOM',
              amount: '950',
              extras: {},
              text: 'Random fee',
            },
          ]
        },
        balances: {
          CURRENCY_EUR: -950,
          EXPENSE_RANDOM: 950,
        },
        stock: {}
      }
    )
  })

})
