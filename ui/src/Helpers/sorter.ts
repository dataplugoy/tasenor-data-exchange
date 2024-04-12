import { InputItem } from '../Types/API/InputItem'
import { OutputItem } from '../Types/API/OutputItem'
import { Run } from '../Types/API/Run'
import { UnifiedItem } from '../Types/API/UnifiedItem'

export type ResultInputItem = { type: 'InputItem' } & InputItem
export type ResultUnifiedItem = { type: 'UnifiedItem' } & UnifiedItem
export type ResultOutputItem = { type: 'OutputItem' } & OutputItem

export type ResultItem = ResultInputItem | ResultUnifiedItem | ResultOutputItem

export function isResultInputItem(obj: unknown): obj is ResultInputItem {
  return obj !== null && typeof obj === 'object' && obj['type'] === 'InputItem'
}
export function isResultUnifiedItem(obj: unknown): obj is ResultUnifiedItem {
  return obj !== null && typeof obj === 'object' && obj['type'] === 'UnifiedItem'
}
export function isResultOutputItem(obj: unknown): obj is ResultOutputItem {
  return obj !== null && typeof obj === 'object' && obj['type'] === 'OutputItem'
}

export type RunResultType = 'All Success' | 'Partly Skipped Success' | 'All Skipped' | 'Partly Fail' | 'All Fail' | 'Not Started'

export type RunResult = {
  run: Run
  result: RunResultType
  done: number | null
  total: number | null
  items: ResultItem[]
}

/**
 * Helper re-arranging runs and their resulting items to more usable structure.
 * @param runs
 * @param inputs
 * @param unifieds
 * @param outputs
 */
export function sortRuns(
  runs: Run[],
  inputs: Record<number, InputItem[]>,
  unifieds: Record<number, UnifiedItem[]>,
  outputs: Record<number, OutputItem[]>): RunResult[] {

  const result: RunResult[] = []

  // Handle in chronological order.
  for (let i = runs.length - 1; i >= 0; i--) {
    const run = runs[i]
    result.push({
      run,
      result: 'Not Started',
      done: null,
      total: null,
      items: []
    })
  }

  result.reverse()

  return result
}
