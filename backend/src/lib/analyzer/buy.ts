import { DateTime } from 'luxon'
import { UnifiedInput } from '../../types/UnifiedInput'
import { AccountCode, Transaction } from '../../types/Transaction'
import { Analyzer } from './Analyzer'
import { chg, dec } from '../utils'
import { Timestring } from '@tasenor/common'

/**
 * Buy an asset and add it to the stock.
 *
 * @param stock
 * @param time
 * @param input
 *
 * Requires fields `assetIn`, `assetAmountIn`.
 */
export async function buy(this: Analyzer, time: DateTime, input: UnifiedInput): Promise<Transaction> {
  // TODO: Handle fee.
  const { assetIn, assetAmountIn } = input

  this.validateBasics()
  this.validateRequired('assetIn', 'assetAmountIn')
  const text = this.validateText('Bought {{amount}} {{asset}}', { asset: assetIn, amount: chg(assetAmountIn) })
  const value = await this.validateValue(assetIn, assetAmountIn)

  return {
    time: time.toUTC().toISO() as Timestring,
    lines: [
      {
        account: `CURRENCY_${this.currency}` as AccountCode,
        amount: dec(value).negated(),
        text,
        extras: {},
      },
      {
        account: `ASSET_${assetIn}` as AccountCode,
        amount: dec(value),
        text,
        extras: {
          asset: assetIn,
          assetChange: dec(assetAmountIn),
        },
      },
    ]
  }
}
