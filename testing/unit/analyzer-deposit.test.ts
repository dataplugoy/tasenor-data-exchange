import { describe, expect, it } from 'vitest'
import { Analyzer } from '../../backend/src/lib/analyzer/Analyzer'
import { Timestring } from '@tasenor/common'
import { UnifiedItemType } from '../../backend/src/types/API/UnifiedItemData'

describe.only('Analyzer', () => {
  it('deposit case', async () => {

    Analyzer.configure({
      currency: 'EUR',
      language: 'en'
    })

    const stock = {
    }
    const input = {
      type: 'deposit' as UnifiedItemType,
      value: 1000,
      account: 'DEPOSIT_TO',
      service: 'Stock inc.',
    }

    const analyzer = await Analyzer.run('2000-01-01T00:00:00Z' as Timestring, stock, input)

    expect(analyzer.toJSON()).toStrictEqual({
        tx: {
          time: '2000-01-01T00:00:00.000Z',
          lines: [
            {
              account: 'CURRENCY_EUR',
              amount: '-1000',
              extras: {},
              text: 'Deposit to Stock inc.',
            },
            {
              account: 'DEPOSIT_TO',
              amount: '1000',
              extras: {},
              text: 'Deposit to Stock inc.',
            },
          ]
        },
        balances: {
          CURRENCY_EUR: -1000,
          DEPOSIT_TO: 1000,
        },
        stock: {}
      }
    )
  })

})
