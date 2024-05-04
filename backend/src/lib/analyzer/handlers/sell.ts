import { DateTime } from 'luxon'
import { Analyzer } from '../Analyzer'
import { chg, dec } from '../../utils'
import { Asset, Timestring, isCurrency } from '@tasenor/common'
import { AccountCode } from '../../../types/AccountCode'
import { TransactionLine } from '../../../types/API/TransactionLine'
import { Transaction } from '../../../types/API/Transaction'
import { UnifiedItemData } from '../../../types/API/UnifiedItemData'

/**
 * Sell an asset and remove it from the stock.
 *
 * @param time
 * @param input
 *
 * Requires fields `assetOut`, `assetAmountOut`.
 * Optional fields `fee`, `feeAsset`.
 */
export async function sell(this: Analyzer, time: DateTime, input: UnifiedItemData): Promise<Transaction> {

  // TODO: Short selling (but only allowed if a setting in project is true).
  const { assetOut, assetAmountOut } = input
  const [fee, feeAsset, feeAssetChange] = await this.validateFee(true)

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
      account: this.validateValueAccount(false),
      amount: dec(value).minus(fee).toString(),
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

  // Making profit.
  if (value.greaterThan(oldValue)) {
    lines.push({
      account: `PROFIT_${assetOut}` as AccountCode,
      amount: value.minus(oldValue).negated().toString(),
      text,
      extras: {},
    })
  }

  // Making losses.
  if (oldValue.greaterThan(value)) {
    lines.push({
      account: `LOSS_${assetOut}` as AccountCode,
      amount: oldValue.minus(value).toString(),
      text,
      extras: {},
    })
  }

  // Add fee.
  if (!fee.eq(0)) {
    const useAsset = feeAsset !== null && !isCurrency(feeAsset)
    lines.push({
      account: (useAsset ? `ASSETFEE_${feeAsset}` : `FEE_${feeAsset || this.currency}`) as AccountCode,
      amount: dec(fee).toString(),
      text, // TODO: Add translated '(fee)' here?
      extras: useAsset ? { asset: feeAsset as Asset, assetChange: feeAssetChange?.negated().toString() } : {},
    })
  }

  return {
    time: time.toUTC().toISO() as Timestring,
    lines
  }
}
