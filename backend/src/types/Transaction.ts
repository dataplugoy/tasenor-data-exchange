import { Timestring } from '@tasenor/common'
import { TransactionLine } from './TransactionLine'

/**
 * A transactional data ready to be delivered to the remote system.
 */
export interface Transaction {
  time: Timestring
  lines: TransactionLine[]
}
