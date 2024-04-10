import Decimal from 'decimal.js'
import { TransactionExtras } from './TransactionExtras'
import { AccountCode } from './AccountCode'

/**
 * A line in the transaction.
 */
export interface TransactionLine {
  account: AccountCode
  amount: Decimal
  text: string
  extras: TransactionExtras
}
