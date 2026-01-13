import { DateTime } from 'luxon'
import { Analyzer } from '../Analyzer'
import { dec } from '../../utils'
import { Timestring } from '@tasenor/common'
import { UnifiedItemData } from '../../../types/API/UnifiedItemData'
import { Transaction } from '../../../types/API/Transaction'
import { AccountCode } from '../../../types/AccountCode'

/**
 * Buy an asset and add it to the stock.
 *
 * @param time
 * @param input
 *
 * Requires fields `assetIn`, `assetAmountIn`, `assetTypeIn`, `assetAmountOut`.
 */
export async function split(this: Analyzer, time: DateTime, input: UnifiedItemData): Promise<Transaction> {

  this.validateBasics()

  this.validateRequired('assetIn', 'assetAmountIn', 'assetTypeIn', 'assetAmountOut')
  const { assetIn, assetTypeIn, assetAmountIn, assetAmountOut } = input
  const tickerIn = this.validateTicker(assetIn as string)
  const text = this.validateText('Split {{asset}} (converted {{out}} to {{in}})', { asset: tickerIn, in: assetAmountIn?.toString(), out: assetAmountOut?.toString() })
  const value = await this.validateValue(true)

  return {
    time: time.toUTC().toISO() as Timestring,
    lines: [
      {
        account: `${assetTypeIn}_${tickerIn}` as AccountCode,
        amount: dec(value).negated().toString(),
        text,
        extras: {
          asset: tickerIn,
          assetChange: dec(assetAmountOut).negated().toString(),
        },
      },
      {
        account: `${assetTypeIn}_${tickerIn}` as AccountCode,
        amount: dec(value).toString(),
        text,
        extras: {
          asset: tickerIn,
          assetChange: dec(assetAmountIn).toString(),
        },
      },
    ]
  }
}
