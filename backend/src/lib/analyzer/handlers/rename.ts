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
 * Requires fields `assetIn`, `assetAmountIn`, `assetTypeIn`, `assetOut`.
 */
export async function rename(this: Analyzer, time: DateTime, input: UnifiedItemData): Promise<Transaction> {

  this.validateBasics()

  this.validateRequired('assetIn', 'assetAmountIn', 'assetTypeIn', 'assetOut')
  const { assetOut, assetIn, assetTypeIn, assetAmountIn } = input
  const tickerIn = this.validateTicker(assetIn as string)
  const tickerOut = this.validateTicker(assetOut as string)

  const text = this.validateText('Renamed {{amount}} {{out}} to {{in}}', { in: tickerIn, out: tickerOut, amount: chg(assetAmountIn) })
  const value = await this.validateValue(true)

  return {
    time: time.toUTC().toISO() as Timestring,
    lines: [
      {
        account: `${assetTypeIn}_${tickerOut}` as AccountCode,
        amount: dec(value).negated().toString(),
        text,
        extras: {
          asset: tickerOut,
          assetChange: dec(assetAmountIn).negated().toString(),
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
