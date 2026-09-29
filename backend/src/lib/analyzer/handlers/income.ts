import { DateTime } from 'luxon'
import { Analyzer } from '../Analyzer'
import { dec } from '../../utils'
import { Timestring } from '@tasenor/common'
import { UnifiedItemData } from '../../../types/API/UnifiedItemData'
import { Transaction, TransactionLine } from '../../../types/API/Transaction'
import { AccountCode } from '../../../types/AccountCode'
import { t } from '../../i18n/t'
import { resolveTax } from './tax'

/**
 * Buy an asset and add it to the stock.
 *
 * @param time
 * @param input
 *
 * Requires alternatively fields `text` or `reason`.
 * Requires alternatively fields `account` or `reason`.
 * Recommended: `reasonAsset`.
 * Optional: `taxType` with `taxAmount` or `taxPercentage` and `taxAsset`.
 */
export async function income(this: Analyzer, time: DateTime, input: UnifiedItemData): Promise<Transaction> {

  this.validateBasics()

  const { account, text, reason, reasonAsset, taxType } = input
  const value = await this.validateValue(true)
  const reasonTicker = reasonAsset ? this.validateTicker(reasonAsset) : null

  if (account === undefined && reason === undefined) {
    this.validateError(`Either 'account' or 'reason' must be given to determine income.`)
  }
  if (text === undefined && reason === undefined) {
    this.validateError(`Either 'text' or 'reason' must be given to determine income.`)
  }

  const resultText = text || t(this.language, `INCOME_${reason}`, { asset: reasonTicker || 'UNKNOWN' })
  const resultAccount = account || `INCOME_${reason}` as AccountCode

  const { tax, account: taxAccount } = await resolveTax(this, input, dec(value), resultAccount as AccountCode)

  // Withholding tax is deducted from the gross value before payment, while other taxes (VAT) are included in the value received.
  const withholding = taxType === 'withholding'

  const lines: TransactionLine[] = [
    {
      account: this.validateValueAccount(false),
      amount: withholding ? dec(value).minus(tax).toString() : dec(value).toString(),
      text: resultText,
      extras: {},
    },
    {
      account: resultAccount,
      amount: withholding ? dec(value).negated().toString() : dec(value).minus(tax).negated().toString(),
      text: resultText,
      extras: {},
    },
  ]

  if (!tax.eq(0)) {
    lines.push({
      account: taxAccount as AccountCode,
      amount: withholding ? tax.toString() : tax.negated().toString(),
      text: resultText,
      extras: {},
    })
  }

  return {
    time: time.toUTC().toISO() as Timestring,
    lines
  }
}
