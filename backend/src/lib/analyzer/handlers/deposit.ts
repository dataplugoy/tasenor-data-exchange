import { DateTime } from 'luxon'
import { Analyzer } from '../Analyzer'
import { chg, dec } from '../../utils'
import { Asset, Timestring } from '@tasenor/common'
import { UnifiedItemData } from '../../../types/API/UnifiedItemData'
import { Transaction } from '../../../types/API/Transaction'
import { AccountCode } from '../../../types/AccountCode'

/**
 * Deposit money from the main currency account to the target service.
 *
 * @param stock
 * @param time
 * @param input
 *
 * Requires fields `account`.
 */
export async function deposit(this: Analyzer, time: DateTime, input: UnifiedItemData): Promise<Transaction> {

  this.validateBasics()
  this.validateNotEmpty('account')
  this.validateNotEmpty('service')

  const { account, service } = input
  const value = await this.validateValue()
  const text = this.validateText('Deposit to {{service}}', { service })

  return {
    time: time.toUTC().toISO() as Timestring,
    lines: [
      {
        account: `CURRENCY_${this.currency}` as AccountCode,
        amount: dec(value).negated().toString(),
        text,
        extras: {},
      },
      {
        account: account as AccountCode,
        amount: dec(value).toString(),
        text,
        extras: {},
      },
    ]
  }
}
