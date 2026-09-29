import { DateTime } from 'luxon'
import { Analyzer } from '../Analyzer'
import { dec } from '../../utils'
import { Timestring } from '@tasenor/common'
import { UnifiedItemData } from '../../../types/API/UnifiedItemData'
import { Transaction, TransactionLine } from '../../../types/API/Transaction'
import { resolveTax } from './tax'
import { AccountCode } from '../../../types/AccountCode'
import { t } from '../../i18n/t'

/**
 * Buy an asset and add it to the stock.
 *
 * @param time
 * @param input
 *
 * Requires alternatively fields `text` or `reason`.
 * Requires alternatively fields `account` or `reason`.
 * Optional: `taxType` 'vat' with `taxAmount` or `taxPercentage` for VAT included in the value.
 */
export async function expense(this: Analyzer, time: DateTime, input: UnifiedItemData): Promise<Transaction> {

  this.validateBasics()

  const { account, text, reason } = input
  const value = await this.validateValue(true)

  if (account === undefined && reason === undefined) {
    this.validateError('Either \'account\' or \'reason\' must be given to determine expense.')
  }
  if (text === undefined && reason === undefined) {
    this.validateError('Either \'text\' or \'reason\' must be given to determine expense.')
  }

  const resultText = text || t(this.language, `EXPENSE_${reason}`)
  const resultAccount = account || `EXPENSE_${reason}` as AccountCode

  if (input.taxType && input.taxType !== 'vat') {
    this.validateError(`Tax type '${input.taxType}' is not supported for expenses.`)
  }
  const { tax, account: taxAccount } = await resolveTax(this, input, dec(value), resultAccount as AccountCode)

  const lines: TransactionLine[] = [
    {
      account: this.validateValueAccount(false),
      amount: dec(value).negated().toString(),
      text: resultText,
      extras: {},
    },
    {
      account: resultAccount,
      amount: dec(value).minus(tax).toString(),
      text: resultText,
      extras: {},
    },
  ]

  if (!tax.eq(0)) {
    lines.push({
      account: taxAccount as AccountCode,
      amount: tax.toString(),
      text: resultText,
      extras: {},
    })
  }

  return {
    time: time.toUTC().toISO() as Timestring,
    lines
  }
}
