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
 * Requires fields `assetOut`, `assetAmountOut`.
 */
export async function forex(this: Analyzer, time: DateTime, input: UnifiedItemData): Promise<Transaction> {

  this.validateBasics()

  const value = await this.validateValue(true)
  this.validateRequired('assetOut', 'assetAmountOut')

  const { assetOut, assetAmountOut, valueAsset } = input
  const text = this.validateText('Sold {{amount}} {{out}} in exhcange to {{in}}', { amount: `${assetAmountOut}`, out: assetOut, in: valueAsset })


  return {
    time: time.toUTC().toISO() as Timestring,
    lines: [
      {
        account: this.validateValueAccount(true),
        amount: dec(value).toString(),
        text,
        extras: {},
      },
      {
        account: this.validateAssetOutAccount(true),
        amount: dec(value).negated().toString(),
        text,
        extras: {},
      },
    ]
  }
}
