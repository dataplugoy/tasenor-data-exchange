import { DateTime } from 'luxon'
import { Analyzer } from '../Analyzer'
import { chg, dec, serviceName2Code } from '../../utils'
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
export async function withdrawal(this: Analyzer, time: DateTime, input: UnifiedItemData): Promise<Transaction> {

  this.validateBasics()
  this.validateNotEmpty('service')

  const { account, service, valueAsset } = input
  const value = await this.validateValue(true)
  const text = this.validateText('Withdrawal from {{service}}', { service })

  const externalAccount = (account || `EXTERNAL_${serviceName2Code(service as string)}_${valueAsset || this.currency}`) as AccountCode

  return {
    time: time.toUTC().toISO() as Timestring,
    lines: [
      {
        account: this.validateValueAccount(false),
        amount: dec(value).negated().toString(),
        text,
        extras: {},
      },
      {
        account: externalAccount,
        amount: dec(value).toString(),
        text,
        extras: {},
      },
    ]
  }
}
