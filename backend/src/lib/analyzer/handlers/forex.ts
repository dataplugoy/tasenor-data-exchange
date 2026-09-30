import { DateTime } from 'luxon'
import { Analyzer } from '../Analyzer'
import { dec } from '../../utils'
import { Timestring } from '@tasenor/common'
import { UnifiedItemData } from '../../../types/API/UnifiedItemData'
import { Transaction, TransactionLine } from '../../../types/API/Transaction'
import { AccountCode } from '../../../types/AccountCode'
import { sprintf } from 'sprintf-js'

/**
 * Buy an asset and add it to the stock.
 *
 * @param time
 * @param input
 *
 * Requires fields (`assetOut` and `assetAmountOut`) or (`assetIn` and `assetAmountIn`).
 * Optional fields `fee` and `feeAsset` for a fee paid from the currency account of the fee asset.
 */
export async function forex(this: Analyzer, time: DateTime, input: UnifiedItemData): Promise<Transaction> {

  this.validateBasics()

  const value = await this.validateValue(true)
  const [fee, feeAsset] = await this.validateFee(true)
  const feeLines = (text: string): TransactionLine[] => fee.eq(0)
    ? []
    : [
        {
          account: `CURRENCY_${feeAsset || this.currency}` as AccountCode,
          amount: fee.negated().toString(),
          text,
          extras: {},
        },
        {
          account: `FEE_${feeAsset || this.currency}` as AccountCode,
          amount: fee.toString(),
          text,
          extras: {},
        },
      ]

  if (input.assetOut) {
    this.validateRequired('assetOut', 'assetAmountOut')

    const { assetOut, assetAmountOut, valueAsset } = input
    const text = this.validateText('Sold {{amount}} {{out}} in exhcange to {{in}}', { amount: `${sprintf('%.2f', assetAmountOut)}`, out: assetOut, in: valueAsset })

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
        ...feeLines(text),
      ]
    }

  } else {
    this.validateRequired('assetIn', 'assetAmountIn')

    const { assetIn, assetAmountIn, valueAsset } = input
    const text = this.validateText('Bought {{amount}} {{in}} in exhcange to {{out}}', { amount: `${sprintf('%.2f', assetAmountIn)}`, in: assetIn, out: valueAsset })

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
        ...feeLines(text),
      ]
    }
  }
}
