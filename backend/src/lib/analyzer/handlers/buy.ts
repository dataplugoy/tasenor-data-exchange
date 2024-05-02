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
 * @param stock
 * @param time
 * @param input
 *
 * Requires fields `assetIn`, `assetAmountIn`.
 */
export async function buy(this: Analyzer, time: DateTime, input: UnifiedItemData): Promise<Transaction> {
  // TODO: Handle fee.
  const { assetIn, assetAmountIn } = input

  this.validateBasics()
  this.validateRequired('assetIn', 'assetAmountIn')
  const text = this.validateText('Bought {{amount}} {{asset}}', { asset: assetIn, amount: chg(assetAmountIn) })
  const value = await this.validateValueOrAsset(assetIn as Asset, dec(assetAmountIn), true)

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
        account: `ASSET_${assetIn}` as AccountCode,
        amount: dec(value).toString(),
        text,
        extras: {
          asset: assetIn,
          assetChange: dec(assetAmountIn).toString(),
        },
      },
    ]
  }
}
