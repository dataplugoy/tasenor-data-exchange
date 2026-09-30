import { DateTime } from 'luxon'
import Decimal from 'decimal.js'
import { Analyzer } from '../Analyzer'
import { chg, dec } from '../../utils'
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
 * Requires fields `assetIn`, `assetAmountIn`, `assetTypeIn`, `assetOut`.
 * Optional `assetAmountOut` when the amount changes (default: `assetAmountIn`).
 * Optional `value` for the cost moved. By default the average cost of the old instrument is moved.
 */
export async function rename(this: Analyzer, time: DateTime, input: UnifiedItemData): Promise<Transaction> {

  this.validateBasics()

  this.validateRequired('assetIn', 'assetAmountIn', 'assetTypeIn', 'assetOut')
  const { assetOut, assetIn, assetTypeIn, assetAmountIn } = input
  const assetAmountOut = input.assetAmountOut === undefined || input.assetAmountOut === null ? assetAmountIn : input.assetAmountOut
  const tickerIn = this.validateTicker(assetIn as string)
  const tickerOut = this.validateTicker(assetOut as string)

  const text = this.validateText('Renamed {{amount}} {{out}} to {{in}}', { in: tickerIn, out: tickerOut, amount: chg(assetAmountIn) })
  let value: Decimal
  if (input.value === undefined || input.value === null) {
    const old = this.stock.getAsset(this.resolveAccount(`${assetTypeIn}_${tickerOut}`), tickerOut)
    value = old.amount.isZero() ? new Decimal(0) : old.value.div(old.amount).mul(dec(assetAmountOut))
  } else {
    value = await this.validateValue(true)
  }

  return {
    time: time.toUTC().toISO() as Timestring,
    lines: [
      {
        account: `${assetTypeIn}_${tickerOut}` as AccountCode,
        amount: dec(value).negated().toString(),
        text,
        extras: {
          asset: tickerOut,
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
