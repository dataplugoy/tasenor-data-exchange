import { DateTime } from 'luxon'
import { Analyzer } from '../Analyzer'
import { chg, dec } from '../../utils'
import { Asset, Timestring, isCurrency, warning } from '@tasenor/common'
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
 * Requires fields `assetOut`, `assetAmountOut`, `assetTypeOut`.
 * Optional fields `fee`, `feeAsset`.
 */
export async function sell(this: Analyzer, time: DateTime, input: UnifiedItemData): Promise<Transaction> {

  const { assetOut, assetAmountOut, assetTypeOut } = input
  const [fee, feeAsset, feeAssetChange] = await this.validateFee(true)

  this.validateBasics()
  this.validateRequired('assetOut', 'assetAmountOut', 'assetTypeOut')
  const value = await this.validateValueOrAsset(assetOut as Asset, dec(assetAmountOut), false)
  const account = this.resolveAccount(`${assetTypeOut}_${assetOut}`)
  const old = this.stock.getAsset(account, assetOut as Asset)
  const oldStockValue = old.value

  if (old.amount.lt(assetAmountOut as number)) {
    if (old.amount.gt(0)) {
      this.validateError('Short selling an instrument at the same time than we sell owned copies is not implemented.')
    }
    const text = this.validateText('Sold short {{amount}} {{asset}}', { asset: assetOut, amount: chg(dec(assetAmountOut).negated()) })
    // TODO: Allow short selling only allowed if a setting allows: always, never, ask.
    // TODO: Support for getSetting()

    // Short-selling.
    const lines: TransactionLine[] = [
      {
        account: this.validateValueAccount(false),
        amount: dec(value).toString(),
        text,
        extras: {},
      },
      {
        account: `${assetTypeOut}_${assetOut}` as AccountCode,
        amount: dec(value).minus(fee).negated().toString(),
        text,
        extras: {
          asset: assetOut,
          assetChange: dec(assetAmountOut).negated().toString(),
        },
      },
    ]

    // Short-selling fee.
    if (!fee.eq(0)) {
      const useAsset = feeAsset !== null && !isCurrency(feeAsset)

      lines.push({
        account: (useAsset ? `CRYPTOFEE_${feeAsset}` : `FEE_${feeAsset || this.currency}`) as AccountCode,
        amount: dec(fee).toString(),
        text,
        extras: useAsset ? { asset: feeAsset as Asset, assetChange: feeAssetChange?.negated().toString() } : {},
      })
    }

    return {
      time: time.toUTC().toISO() as Timestring,
      lines
    }
  }

  const text = this.validateText('Sold {{amount}} {{asset}}', { asset: assetOut, amount: chg(dec(assetAmountOut).negated()) })
  const oldValue = old.amount.eq(0) ? dec(0) : oldStockValue.div(old.amount).mul(assetAmountOut as number)

  const lines: TransactionLine[] = [
    {
      account: this.validateValueAccount(false),
      amount: dec(value).minus(fee).toString(),
      text,
      extras: {},
    },
    {
      account: `${assetTypeOut}_${assetOut}` as AccountCode,
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
      account: (useAsset ? `CRYPTO_${feeAsset}` : `FEE_${feeAsset || this.currency}`) as AccountCode,
      amount: dec(fee).toString(),
      text,
      extras: useAsset ? { asset: feeAsset as Asset, assetChange: feeAssetChange?.negated().toString() } : {},
    })
  }

  return {
    time: time.toUTC().toISO() as Timestring,
    lines
  }
}
