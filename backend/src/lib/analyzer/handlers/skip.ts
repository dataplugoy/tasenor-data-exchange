import { DateTime } from 'luxon'
import { Analyzer } from '../Analyzer'
import { Timestring } from '@tasenor/common'
import { UnifiedItemData } from '../../../types/API/UnifiedItemData'
import { Transaction } from '../../../types/API/Transaction'

/**
 * Create empty transaction.
 *
 * @param time
 * @param input
 */
export async function skip(this: Analyzer, time: DateTime, input: UnifiedItemData): Promise<Transaction> {

  return {
    time: time.toUTC().toISO() as Timestring,
    lines: [
    ]
  }
}
