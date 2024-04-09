import { Asset, Timestring } from '@tasenor/common'

/**
 * Main category of the transaction.
 */
export type InputType = 'buy' | 'sell' | 'trade' | 'income' | 'expense' | 'dividend'

/**
 * Type of the tax involved.
 */
export type TaxType = 'vat'

/**
 * An input item produced by the InputSource parser.
 */
export interface UnifiedInput {
  type: InputType
  time: Timestring
  // In case of buying some asset, these may be filled in.
  assetIn?: Asset // Asset that has been traded in.
  assetAmountIn?: number // Number of assets received.
  assetValueIn?: number // Value of the incoming stuff in terms of `valueAsset`.
  // In case of selling some asset, these may be filled in.
  assetOut?: Asset // Asset that has been traded out.
  assetAmountOut?: number // Number of assets given.
  assetValueOut?: number // Value of the outgoing stuff in terms of `valueAsset`.
  // If fee is involved, these may be filled in.
  fee?: number // Amount of fee charged.
  feeAsset?: Asset // Unit of the fee (defaults to `valueAsset`).
  // If tax must be calculated, these are filled in.
  taxType?: TaxType // Type of tax involved.
  taxAmount?: number // Amount of tax.
  taxAsset?: Asset // Unit of the tax (defaults to `valueAsset`).
  taxPercentage?: number // Alternatively a % to be charged from the total.
  // Total value of the transaction in terms of an asset (usually default currency) if known.
  value?: number // Total value of the underlying transaction.
  valueAsset?: Asset // Unit of the total (defaults to the default currency).
}
