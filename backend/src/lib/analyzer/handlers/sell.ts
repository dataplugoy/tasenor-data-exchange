import { DateTime } from 'luxon'
import { Analyzer } from '../Analyzer'
import { chg, dec } from '../../utils'
import { Asset, Timestring } from '@tasenor/common'
import { AccountCode } from '../../../types/AccountCode'
import { TransactionLine } from '../../../types/API/TransactionLine'
import { Transaction } from '../../../types/API/Transaction'
import { UnifiedItemData } from '../../../types/API/UnifiedItemData'

/**
 * Sell an asset and remove it from the stock.
 *
 * @param stock
 * @param time
 * @param input
 *
 * Requires fields `assetOut`, `assetAmountOut`.
 */
export async function sell(this: Analyzer, time: DateTime, input: UnifiedItemData): Promise<Transaction> {
  // TODO: Handle fee.
  // TODO: Short selling (but only allowed if a setting in project is true).
  const { assetOut, assetAmountOut } = input

  this.validateBasics()
  this.validateRequired('assetOut', 'assetAmountOut')
  const text = this.validateText('Sold {{amount}} {{asset}}', { asset: assetOut, amount: chg(dec(assetAmountOut).negated()) })
  const value = await this.validateValueOrAsset(assetOut as Asset, dec(assetAmountOut), false)
  const account = `ASSET_${assetOut}` as AccountCode
  const oldStockValue = this.stock.getValue(account, assetOut as Asset)
  if (oldStockValue === null) {
    throw new Error(`Unable to find asset ${assetOut} from the stock when trying to sell ${assetAmountOut} of them.`)
  }
  const oldValue = oldStockValue.mul(assetAmountOut as number)

  const lines: TransactionLine[] = [
    {
      account: `CURRENCY_${this.currency}` as AccountCode,
      amount: dec(value).toString(),
      text,
      extras: {},
    },
    {
      account: `ASSET_${assetOut}` as AccountCode,
      amount: dec(oldValue).negated().toString(),
      text,
      extras: {
        asset: assetOut,
        assetChange: dec(assetAmountOut).negated().toString(),
      },
    },
  ]

  if (value.greaterThan(oldValue)) {
    lines.push({
      account: `PROFIT_${assetOut}` as AccountCode,
      amount: value.minus(oldValue).negated().toString(),
      text,
      extras: {},
    })
  }

  if (oldValue.greaterThan(value)) {
    lines.push({
      account: `LOSS_${assetOut}` as AccountCode,
      amount: oldValue.minus(value).toString(),
      text,
      extras: {},
    })
  }

  return {
    time: time.toUTC().toISO() as Timestring,
    lines
  }
}
