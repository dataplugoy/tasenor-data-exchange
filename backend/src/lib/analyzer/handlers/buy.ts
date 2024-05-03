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
 * Requires fields `assetIn`, `assetAmountIn`.
 * Optional fields `fee`, `feeAsset`.
 */
export async function buy(this: Analyzer, time: DateTime, input: UnifiedItemData): Promise<Transaction> {
  const { assetIn, assetAmountIn } = input

  this.validateBasics()
  this.validateRequired('assetIn', 'assetAmountIn')
  const text = this.validateText('Bought {{amount}} {{asset}}', { asset: assetIn, amount: chg(assetAmountIn) })
  const value = await this.validateValueOrAsset(assetIn as Asset, dec(assetAmountIn), true)
  const [fee, feeAsset, feeAssetChange] = await this.validateFee(true)

  const lines: TransactionLine[] = [
    {
      account: this.validateAccount(),
      amount: dec(value).negated().toString(),
      text,
      extras: {},
    },
    {
      account: `ASSET_${assetIn}` as AccountCode,
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
