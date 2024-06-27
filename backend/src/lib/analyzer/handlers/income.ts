import { DateTime } from 'luxon'
import { Analyzer } from '../Analyzer'
import { dec } from '../../utils'
import { Asset, Timestring } from '@tasenor/common'
import { UnifiedItemData } from '../../../types/API/UnifiedItemData'
import { Transaction, TransactionLine } from '../../../types/API/Transaction'
import { AccountCode } from '../../../types/AccountCode'
import { t } from '../../i18n/t'
import Decimal from 'decimal.js'

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

  if (account === undefined && reason === undefined) {
    this.validateError(`Either 'account' or 'reason' must be given to determine income.`)
  }
  if (text === undefined && reason === undefined) {
    this.validateError(`Either 'text' or 'reason' must be given to determine income.`)
  }

  const resultText = text || t(this.language, `INCOME_${reason}`, { asset: reasonAsset || 'UNKNOWN' })
  const resultAccount = account || `INCOME_${reason}` as AccountCode

  let tax = new Decimal(0)
  if (taxType) {
    this.validateRequired('taxAsset')
    const { taxAmount, taxPercentage, taxAsset } = input
    if (taxAmount === undefined && taxPercentage === undefined) {
      this.validateError('Either taxAmount or taxPercentage is required.')
    }
    if (!taxAmount) {
      this.validateError('Tax percentage not yet implemented.')
    }
    tax = await this.validateAsset(taxAsset as Asset, dec(taxAmount), true)
  }

  const lines: TransactionLine[] = [
    {
      account: this.validateValueAccount(false),
      amount: dec(value).toString(),
      text: resultText,
      extras: {},
    },
    {
      account: resultAccount,
      amount: dec(value).minus(tax).negated().toString(),
      text: resultText,
      extras: {},
    },
  ]

  if (!tax.eq(0)) {
    lines.push({
      account: `TAX_${(taxType as string).toUpperCase()}`,
      amount: tax.negated().toString(),
      text: resultText,
      extras: {},
    })
  }

  return {
    time: time.toUTC().toISO() as Timestring,
    lines
  }
}
