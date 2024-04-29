import { InputItem } from '../Types/API/InputItem'
import { OutputItem } from '../Types/API/OutputItem'
import { Run } from '../Types/API/Run'
import { UnifiedItem } from '../Types/API/UnifiedItem'

export type ResultInputItem = { type: 'InputItem' } & InputItem
export type ResultUnifiedItem = { type: 'UnifiedItem' } & UnifiedItem
export type ResultOutputItem = { type: 'OutputItem' } & OutputItem

export type ResultItem = ResultInputItem | ResultUnifiedItem | ResultOutputItem

export function isResultInputItem(obj: unknown): obj is ResultInputItem {
  return obj !== null && typeof obj === 'object' && 'type' in obj && obj.type === 'InputItem'
}
export function isResultUnifiedItem(obj: unknown): obj is ResultUnifiedItem {
  return obj !== null && typeof obj === 'object' && 'type' in obj && obj.type === 'UnifiedItem'
}
export function isResultOutputItem(obj: unknown): obj is ResultOutputItem {
  return obj !== null && typeof obj === 'object' && 'type' in obj && obj.type === 'OutputItem'
}

export type RunStepType =
  | 'FAILED_AFTER_BATCH_CREATED'
  | 'FAILED_AFTER_DATA_FETCHED'
  | 'FAILED_AFTER_DATA_PARSED'
  | 'FAILED_AFTER_ITEMS_UNIFIED'
  | 'FAILED_AFTER_OUTPUT_CREATED'
  | 'FAILED_AFTER_OUTPUT_DELIVERED'
  | 'SUCCESSFUL_BATCH_CREATED'
  | 'SUCCESSFUL_DATA_FETCHED'
  | 'SUCCESSFUL_DATA_PARSED'
  | 'SUCCESSFUL_ITEMS_UNIFIED'
  | 'SUCCESSFUL_OUTPUT_CREATED'
  | 'SUCCESSFUL_OUTPUT_DELIVERED'

// TODO: Overlaps Prisma type. Rename.
export type RunResult = {
  run: Run
  step: RunStepType
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

  const results: RunResult[] = []
  let lastSuccess: null | RunResult = null

  // Handle in chronological order.
  for (let i = runs.length - 1; i >= 0; i--) {
    const run = runs[i]
    let step: RunStepType = 'FAILED_AFTER_BATCH_CREATED'
    let items: ResultItem[] = []
    const hasProgressed = (run.initialState !== run.finalState);

    // Categorize items.
    (inputs[run.id] || []).forEach((item: InputItem) => {
      items.push({ type: 'InputItem', ...item })
    });
    (unifieds[run.id] || []).forEach(item => {
      items.push({ type: 'UnifiedItem', ...item })
    });
    (outputs[run.id] || []).forEach(item => {
      items.push({ type: 'OutputItem', ...item })
    })

    if (hasProgressed) {
      step = `SUCCESSFUL_${run.finalState}`
      if (run.finalState === 'OUTPUT_DELIVERED') {
        items = lastSuccess?.items || []
      }
    } else {
      // Pass last known items for further investigation.
      step = `FAILED_AFTER_${run.finalState}`
      items = lastSuccess?.items || []
    }

    // Collect the results.
    const result = {
      step,
      run,
      items
    }

    results.push(result)

    if (hasProgressed) {
      lastSuccess = result
    }
  }

  results.reverse()

  return results
}
