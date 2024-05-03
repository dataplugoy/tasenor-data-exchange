import { DateTime } from 'luxon'
import { Analyzer } from '../Analyzer'
import { chg, dec } from '../../utils'
import { Asset, Timestring } from '@tasenor/common'
import { UnifiedItemData } from '../../../types/API/UnifiedItemData'
import { Transaction } from '../../../types/API/Transaction'
import { AccountCode } from '../../../types/AccountCode'

/**
 * Buy an asset and add it to the stock.
 *
 * @param time
 * @param input
 *
 * Requires fields `account`, `text`.
 */
export async function expense(this: Analyzer, time: DateTime, input: UnifiedItemData): Promise<Transaction> {

  this.validateBasics()
  this.validateNotEmpty('account')
  this.validateNotEmpty('text')

  const { account, text } = input
  const value = await this.validateValue(true)

  return {
    time: time.toUTC().toISO() as Timestring,
    lines: [
      {
        account: this.validateAccount(),
        amount: dec(value).negated().toString(),
        text: text as string,
        extras: {},
      },
      {
        account: account as AccountCode,
        amount: dec(value).toString(),
        text: text as string,
        extras: {},
      },
    ]
  }
}
