import { describe, expect, it } from 'vitest'
import { TFunction } from 'i18next'
import { accountLabel } from '../../ui/src/Helpers/rules'
import en from '../../backend/src/lib/i18n/en.json'

describe('Account label', () => {

  const t = ((key: string) => en[key] ?? key) as unknown as TFunction

  it('uses the general description for a grouped account', () => {
    expect(accountLabel(t, 'FEE')).toBe('General purpose account for fees charged')
    expect(accountLabel(t, 'CRYPTO')).toBe('An account to keep value of the crypto currencies bought')
  })

  it('uses the description of the code or the code itself', () => {
    expect(accountLabel(t, 'EXPENSE_SOFTWARE')).toBe('Software')
    expect(accountLabel(t, 'FEE_EUR')).toBe('FEE_EUR')
    expect(accountLabel(t, 'ACCOUNT_1910')).toBe('Account {{number}}')
  })
})
