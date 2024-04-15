import { Asset } from '@tasenor/common'
import Decimal from 'decimal.js'

// TODO: Use from API.

/**
 * Additional custom information added to the transaction line.
 */
export interface TransactionExtras {
  asset?: Asset
  assetChange?: Decimal
}
