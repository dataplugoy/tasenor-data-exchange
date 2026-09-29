import { describe, expect, it } from 'vitest'
import { Timestring } from '@tasenor/common'
import { UnifiedItemData } from '../../backend/src/types/API/UnifiedItemData'
import { runAnalyzer } from '../lib/unit-testing'

const projectSettings = { currency: 'EUR', language: 'en' }

async function lines(input: UnifiedItemData): Promise<[string, string][]> {
  const analyzer = await runAnalyzer(projectSettings, '2000-01-01T00:00:00Z' as Timestring, {}, input)
  return analyzer.toJSON().tx.lines.map(line => [line.account, line.amount])
}

describe('VAT', () => {

  it('expense with VAT percentage', async () => {
    expect(await lines({ type: 'expense', value: 124, account: 'EXPENSE_SOFTWARE', text: 'Software', taxType: 'vat', taxPercentage: 24 })).toStrictEqual([
      ['CURRENCY_EUR', '-124'],
      ['EXPENSE_SOFTWARE', '100'],
      ['TAX_VAT_FROM_PURCHASES', '24'],
    ])
  })

  it('VAT is rounded to cents', async () => {
    // 100.80 * 25.5 / 125.5 = 20.4812...
    expect(await lines({ type: 'expense', value: 100.8, account: 'EXPENSE_SOFTWARE', text: 'Server', taxType: 'vat', taxPercentage: 25.5 })).toStrictEqual([
      ['CURRENCY_EUR', '-100.8'],
      ['EXPENSE_SOFTWARE', '80.32'],
      ['TAX_VAT_FROM_PURCHASES', '20.48'],
    ])
  })

  it('expense with VAT amount', async () => {
    expect(await lines({ type: 'expense', value: 19.65, account: 'EXPENSE_BANKING_FEE', text: 'Fees', taxType: 'vat', taxAmount: 0.8 })).toStrictEqual([
      ['CURRENCY_EUR', '-19.65'],
      ['EXPENSE_BANKING_FEE', '18.85'],
      ['TAX_VAT_FROM_PURCHASES', '0.8'],
    ])
  })

  it('refund of an expense reduces purchase VAT', async () => {
    expect(await lines({ type: 'income', value: 12.4, account: 'EXPENSE_SOFTWARE', text: 'Refund', taxType: 'vat', taxPercentage: 24 })).toStrictEqual([
      ['CURRENCY_EUR', '12.4'],
      ['EXPENSE_SOFTWARE', '-10'],
      ['TAX_VAT_FROM_PURCHASES', '-2.4'],
    ])
  })

  it('sales with VAT', async () => {
    expect(await lines({ type: 'income', value: 125.5, account: 'INCOME_FINLAND_SALES', text: 'Sales', taxType: 'vat', taxPercentage: 25.5 })).toStrictEqual([
      ['CURRENCY_EUR', '125.5'],
      ['INCOME_FINLAND_SALES', '-100'],
      ['TAX_VAT_FROM_SALES', '-25.5'],
    ])
  })

  it('direct account follows the type of the item', async () => {
    expect(await lines({ type: 'income', value: 124, account: 'ACCOUNT_3000', text: 'Sales', taxType: 'vat', taxPercentage: 24 })).toStrictEqual([
      ['CURRENCY_EUR', '124'],
      // Direct account numbers are passed as such.
      ['3000', '-100'],
      ['TAX_VAT_FROM_SALES', '-24'],
    ])
  })

  it('only VAT is supported for expenses', async () => {
    await expect(lines({ type: 'expense', value: 10, account: 'EXPENSE_X', text: 'X', taxType: 'withholding', taxAmount: 1 })).rejects.toThrow()
  })
})
