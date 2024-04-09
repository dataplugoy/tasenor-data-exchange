import { DateTime } from 'luxon'
import { UnifiedInput } from '../../../types/UnifiedInput'
import { AccountCode, Transaction } from '../../../types/Transaction'
import { Analyzer } from '../Analyzer'
import { chg, dec } from '../../utils'
import { Asset, Timestring } from '@tasenor/common'
import { TransactionLine } from '../../../types/Transaction'

/**
 * Sell an asset and remove it from the stock.
 *
 * @param stock
 * @param time
 * @param input
 *
 * Requires fields `assetOut`, `assetAmountOut`.
 */
export async function sell(this: Analyzer, time: DateTime, input: UnifiedInput): Promise<Transaction> {
  // TODO: Handle fee.
  const { assetOut, assetAmountOut } = input

  this.validateBasics()
  this.validateRequired('assetOut', 'assetAmountOut')
  const text = this.validateText('Sold {{amount}} {{asset}}', { asset: assetOut, amount: chg(dec(assetAmountOut).negated()) })
  const value = await this.validateValue(assetOut, assetAmountOut)
  const oldValue = this.stock.getValue(assetOut as Asset).mul(assetAmountOut as number)

  const lines: TransactionLine[] = [
    {
      account: `CURRENCY_${this.currency}` as AccountCode,
      amount: dec(value),
      text,
      extras: {},
    },
    {
      account: `ASSET_${assetOut}` as AccountCode,
      amount: dec(oldValue).negated(),
      text,
      extras: {
        asset: assetOut,
        assetChange: dec(assetAmountOut).negated(),
      },
    },
  ]

  if (value.greaterThan(oldValue)) {
    lines.push({
      account: `PROFIT_${assetOut}` as AccountCode,
      amount: value.minus(oldValue).negated(),
      text,
      extras: {},
    })
  }

  if (oldValue.greaterThan(value)) {
    lines.push({
      account: `LOSS_${assetOut}` as AccountCode,
      amount: oldValue.minus(value),
      text,
      extras: {},
    })
  }

  return {
    time: time.toUTC().toISO() as Timestring,
    lines
  }
}
