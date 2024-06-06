import { DateTime } from 'luxon'
import { Analyzer } from '../Analyzer'
import { chg, dec } from '../../utils'
import { Asset, Timestring, isCurrency } from '@tasenor/common'
import { UnifiedItemData } from '../../../types/API/UnifiedItemData'
import { Transaction, TransactionLine } from '../../../types/API/Transaction'
import { AccountCode } from '../../../types/AccountCode'
import Decimal from 'decimal.js'

/**
 * Buy an asset and add it to the stock.
 *
 * @param time
 * @param input
 *
 * Requires fields `assetIn`, `assetAmountIn`, `assetTypeIn`.
 * Optional fields `fee`, `feeAsset`.
 */
export async function buy(this: Analyzer, time: DateTime, input: UnifiedItemData): Promise<Transaction> {
  const { assetIn, assetAmountIn, assetTypeIn } = input

  this.validateBasics()
  this.validateRequired('assetIn', 'assetAmountIn', 'assetTypeIn')
  const value = await this.validateValueOrAsset(assetIn as Asset, dec(assetAmountIn), true)
  const [fee, feeAsset, feeAssetChange] = await this.validateFee(true)
  const account = `${assetTypeIn}_${assetIn}` as AccountCode

  const old = this.stock.getAsset(account, assetIn as Asset)

  if (old.amount.lt(0)) {

    if (old.amount.negated().lt(assetAmountIn as number)) {
      this.validateError('Buying more of short-sold instrument than negative amount is not implemented.')
    }
    // Reverting short selling.
    const oldValue = this.stock.getValue(account, assetIn as Asset)?.mul(assetAmountIn as number)

    const text = this.validateText('Closing short position by buying {{amount}} {{asset}}', { asset: assetIn, amount: chg(assetAmountIn) })

    const lines: TransactionLine[] = [
      {
        account: this.validateValueAccount(false),
        amount: dec(value).minus(fee).negated().toString(),
        text,
        extras: {},
      },
      {
        account: account as AccountCode,
        amount: dec(oldValue).toString(),
        text,
        extras: {
          asset: assetIn,
          assetChange: dec(assetAmountIn).toString(),
        },
      },
    ]

    // Making profit.
    if (oldValue?.gt(value)) {
      lines.push({
        account: `PROFIT_${assetIn}` as AccountCode,
        amount: oldValue.minus(value).negated().toString(),
        text,
        extras: {},
      })
    }

    return {
      time: time.toUTC().toISO() as Timestring,
      lines
    }

  }

  const text = this.validateText('Bought {{amount}} {{asset}}', { asset: assetIn, amount: chg(assetAmountIn) })

  const lines: TransactionLine[] = [
    {
      account: this.validateValueAccount(false),
      amount: dec(value).negated().toString(),
      text,
      extras: {},
    },
    {
      account: account,
      amount: dec(value).minus(fee).toString(),
      text,
      extras: {
        asset: assetIn,
        assetChange: dec(assetAmountIn).toString(),
      },
    },
  ]

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
