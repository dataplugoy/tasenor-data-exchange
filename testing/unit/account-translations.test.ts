import { describe, expect, it } from 'vitest'
import { VARIABLE_MAP } from '../../backend/src/lib/analyzer/resolver'
import en from '../../backend/src/lib/i18n/en.json'
import fi from '../../backend/src/lib/i18n/fi.json'

describe('Account translations', () => {

  it('describe every account of the account grouping', () => {
    for (const code of Object.keys(VARIABLE_MAP)) {
      expect(en, `en ACCOUNT_GENERAL_${code}`).toHaveProperty(`ACCOUNT_GENERAL_${code}`)
      expect(fi, `fi ACCOUNT_GENERAL_${code}`).toHaveProperty(`ACCOUNT_GENERAL_${code}`)
    }
  })
})
