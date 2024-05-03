import { DateTime } from 'luxon'
import { Analyzer } from '../Analyzer'
import { chg, dec } from '../../utils'
import { Asset, Timestring } from '@tasenor/common'
import { UnifiedItemData } from '../../../types/API/UnifiedItemData'
import { Transaction } from '../../../types/API/Transaction'
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
 */
export async function expense(this: Analyzer, time: DateTime, input: UnifiedItemData): Promise<Transaction> {

  this.validateBasics()

  const { account, text, reason } = input
  const value = await this.validateValue(true)

  if (account === undefined && reason === undefined) {
    this.validateError(`Either 'account' or 'reason' must be given to determine income.`)
  }
  if (text === undefined && reason === undefined) {
    this.validateError(`Either 'account' or 'reason' must be given to determine income.`)
  }

  const resultText = text || t(`EXPENSE_${reason}`)
  const resultAccount = account || `EXPENSE_${reason}` as AccountCode

  return {
    time: time.toUTC().toISO() as Timestring,
    lines: [
      {
        account: this.validateAccount(),
        amount: dec(value).negated().toString(),
        text: resultText,
        extras: {},
      },
      {
        account: resultAccount,
        amount: dec(value).toString(),
        text: resultText,
        extras: {},
      },
    ]
  }
}
