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
 * @param time
 * @param input
 *
 * Requires field `service`.
 * Optional field `account`.
 */
export async function deposit(this: Analyzer, time: DateTime, input: UnifiedItemData): Promise<Transaction> {

  this.validateBasics()
  this.validateNotEmpty('service')

  const { account, service } = input
  const value = await this.validateValue(true)
  const text = this.validateText('Deposit to {{service}}', { service })

  const resultAccount = (account || `${service}_${this.validateAccount()}`) as AccountCode

  return {
    time: time.toUTC().toISO() as Timestring,
    lines: [
      {
        account: this.validateAccount(),
        amount: dec(value).negated().toString(),
        text,
        extras: {},
      },
      {
        account: resultAccount,
        amount: dec(value).toString(),
        text,
        extras: {},
      },
    ]
  }
}
