import { describe, expect, it } from 'vitest'
import { Timestring } from '@tasenor/common'
import { UnifiedItemType } from '../../backend/src/types/API/UnifiedItemData'
import { runAnalyzer } from '../lib/unit-testing'

describe('Analyzer', () => {

  const projectSettings = { currency: 'EUR', language: 'en' }

  it('deposit case', async () => {

    const stock = {
    }
    const input = {
      type: 'deposit' as UnifiedItemType,
      value: 1000,
      account: 'EXTERNAL_DEPOSIT_FROM',
      service: 'Stock inc.',
    }
    const setup = {
      settings: {
        skipDeposits: false
      }
    }

    const analyzer = await runAnalyzer(projectSettings, '2000-01-01T00:00:00Z' as Timestring, stock, input, { userId: 0 }, setup)

    expect(analyzer.toJSON()).toStrictEqual({
      tx: {
        time: '2000-01-01T00:00:00.000Z',
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '1000',
            extras: {},
            text: 'Deposit to Stock inc.',
          },
          {
            account: 'EXTERNAL_DEPOSIT_FROM',
            amount: '-1000',
            extras: {},
            text: 'Deposit to Stock inc.',
          },
        ]
      },
      balances: {
        CURRENCY_EUR: 1000,
        EXTERNAL_DEPOSIT_FROM: -1000,
      },
      stock: {}
    }
    )
  })

})
