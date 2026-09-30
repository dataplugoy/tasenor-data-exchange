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
 * Requires fields `assetIn`, `assetAmountIn`, `assetTypeIn`.
 * Optional fields `fee`, `feeAsset`.
 */
export async function buy(this: Analyzer, time: DateTime, input: UnifiedItemData): Promise<Transaction> {
  const { assetIn, assetAmountIn, assetTypeIn } = input

  this.validateBasics()
  this.validateRequired('assetIn', 'assetAmountIn', 'assetTypeIn')
  const tickerIn = this.validateTicker(assetIn as string)

  const value = await this.validateValueOrAsset(tickerIn, dec(assetAmountIn), true)
  const [fee, feeAsset, feeAssetChange] = await this.validateFee(true)
  const account = `${assetTypeIn}_${tickerIn}` as AccountCode

  const old = this.stock.getAsset(this.resolveAccount(account), tickerIn)

  if (old.amount.lt(0)) {

    if (old.amount.negated().lt(assetAmountIn as number)) {
      this.validateError('Buying more of short-sold instrument than negative amount is not implemented.')
    }
    // Reverting short selling.
    const oldValue = this.stock.getValue(this.resolveAccount(account), tickerIn)?.mul(assetAmountIn as number)

    const text = this.validateText('Closing short position by buying {{amount}} {{asset}}', { asset: tickerIn, amount: chg(assetAmountIn) })
    // The value includes the fee like in normal buying, but the result is from the price.
    const price = dec(value).minus(fee)

    const lines: TransactionLine[] = [
      {
        account: this.validateValueAccount(false),
        amount: dec(value).negated().toString(),
        text,
        extras: {},
      },
      {
        account: account as AccountCode,
        amount: dec(oldValue).toString(),
        text,
        extras: {
          asset: tickerIn,
          assetChange: dec(assetAmountIn).toString(),
        },
      },
    ]

    // Making profit.
    if (oldValue?.gt(price)) {
      lines.push({
        account: `PROFIT_${tickerIn}` as AccountCode,
        amount: oldValue.minus(price).negated().toString(),
        text,
        extras: {},
      })
    }

    // Making losses.
    if (oldValue?.lt(price)) {
      lines.push({
        account: `LOSS_${tickerIn}` as AccountCode,
        amount: price.minus(oldValue).toString(),
        text,
        extras: {},
      })
    }

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

  // Normal buying. An asset received without cost (e.g. spinoff) has no money line.
  const text = this.validateText('Bought {{amount}} {{asset}}', { asset: tickerIn, amount: chg(assetAmountIn) })

  const lines: TransactionLine[] = [
    ...(dec(value).isZero() && fee.isZero()
      ? []
      : [{
          account: this.validateValueAccount(false),
          amount: dec(value).negated().toString(),
          text,
          extras: {},
        }]),
    {
      account,
      amount: dec(value).minus(fee).toString(),
      text,
      extras: {
        asset: tickerIn,
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
