import { DateTime } from 'luxon'
import { Analyzer } from '../Analyzer'
import { dec } from '../../utils'
import { Timestring } from '@tasenor/common'
import { UnifiedItemData } from '../../../types/API/UnifiedItemData'
import { Transaction } from '../../../types/API/Transaction'

/**
 * Buy an asset and add it to the stock.
 *
 * @param time
 * @param input
 *
 * Requires fields (`assetOut` and `assetAmountOut`) or (`assetIn` and `assetAmountIn`).
 */
export async function forex(this: Analyzer, time: DateTime, input: UnifiedItemData): Promise<Transaction> {

  this.validateBasics()

  const value = await this.validateValue(true)

  if (input.assetOut) {
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

  } else {
    this.validateRequired('assetIn', 'assetAmountIn')

    const { assetIn, assetAmountIn, valueAsset } = input
    const text = this.validateText('Bought {{amount}} {{in}} in exhcange to {{out}}', { amount: `${assetAmountIn}`, in: assetIn, out: valueAsset })

    return {
      time: time.toUTC().toISO() as Timestring,
      lines: [
        {
          account: this.validateValueAccount(true),
          amount: dec(value).negated().toString(),
          text,
          extras: {},
        },
        {
          account: this.validateAssetInAccount(true),
          amount: dec(value).toString(),
          text,
          extras: {},
        },
      ]
    }
  }
}
