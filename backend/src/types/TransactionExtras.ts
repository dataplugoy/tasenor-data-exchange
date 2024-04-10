import { Asset } from '@tasenor/common'
import Decimal from 'decimal.js'

/**
 * Additional custom information added to the transaction line.
 */
export interface TransactionExtras {
  asset?: Asset
  assetChange?: Decimal
}
