import { DateTime } from 'luxon'
import { Analyzer } from '../Analyzer'
import { chg, dec } from '../../utils'
import { Asset, Timestring, isCurrency } from '@tasenor/common'
import { UnifiedItemData } from '../../../types/API/UnifiedItemData'
import { Transaction, TransactionLine } from '../../../types/API/Transaction'
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
  const text = this.validateText('Split {{asset}} (converted {{out}} to {{in}})', { asset: assetIn, in: assetAmountIn?.toString(), out: assetAmountOut?.toString() })
  const value = await this.validateValue(true)

  return {
    time: time.toUTC().toISO() as Timestring,
    lines: [
      {
        account: `${assetTypeIn}_${assetIn}` as AccountCode,
        amount: dec(value).negated().toString(),
        text,
        extras: {
          asset: assetIn,
          assetChange: dec(assetAmountOut).negated().toString(),
        },
      },
      {
        account: `${assetTypeIn}_${assetIn}` as AccountCode,
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
