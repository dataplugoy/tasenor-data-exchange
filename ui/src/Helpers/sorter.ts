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

// TODO: Get from API model.
export type RunResultType = 'All Success' | 'Partly Skipped Success' | 'All Skipped' | 'Partly Fail' | 'All Failed' | 'No Progress'
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

export type RunResult = {
  run: Run
  result: RunResultType
  step: RunStepType
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

  const results: RunResult[] = []
  let lastSuccess: null | RunResult = null

  // Handle in chronological order.
  for (let i = runs.length - 1; i >= 0; i--) {
    const run = runs[i]
    let resultType: RunResultType = 'No Progress'
    let step: RunStepType = 'FAILED_AFTER_BATCH_CREATED'
    let done: number | null = null
    let total: number | null = null
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

    // Based on the progress, fill in the result.
    if (hasProgressed) {

      if (run.finalState === 'OUTPUT_DELIVERED') {
        items = lastSuccess?.items || []
      }
      const skips = items.filter(item => item.skipped)
      const hasSkips = skips.length > 0
      const hasAllSkips = items.length > 0 && items.length === skips.length
      const success = items.filter(item => (isResultOutputItem(item) && item.delivered) || (!isResultOutputItem(item) && item.processed))
      const hasAllSuccess = items.length > 0 && items.length === success.length

      switch (run.finalState) {
        case 'DATA_FETCHED':
          done = 1
          total = 1
          resultType = 'All Success'
          break
        case 'DATA_PARSED':
          done = items.length
          total = items.length
          resultType = 'All Success'
          break
        case 'ITEMS_UNIFIED':
          done = success.length + skips.length
          total = items.length
          break
        case 'OUTPUT_CREATED':
          done = items.length
          total = items.length
          resultType = 'All Success'
          break
        case 'OUTPUT_DELIVERED':
          done = success.length + skips.length
          total = items.length
          break
        default:
          throw new Error(`State of success '${run.finalState}' not yet implemented.`)
      }

      if (hasAllSuccess) {
        resultType = 'All Success'
      } else if (hasAllSkips) {
        resultType = 'All Skipped'
      } else if (hasSkips) {
        resultType = 'Partly Skipped Success'
      }
      step = `SUCCESSFUL_${run.finalState}`

    } else {
      // Get data from the last successful.
      const lastItems = lastSuccess?.items || []
      const skips = lastItems.filter(item => item.skipped)
      const success = lastItems.filter(item => (isResultOutputItem(item) && item.delivered) || (!isResultOutputItem(item) && item.processed))
      const failures = lastItems.filter(item => item.error !== null)

      // Mark the last item not to show confusing items.

      switch (run.initialState) {
        case 'DATA_PARSED':
          done = skips.length + success.length
          total = lastSuccess?.items.length || null
          break
        case 'ITEMS_UNIFIED':
          done = skips.length + success.length
          total = lastSuccess?.items.length || null
          break
        case 'OUTPUT_CREATED':
          done = skips.length + success.length
          total = lastSuccess?.items.length || null
          break
        default:
          throw new Error(`State of failure '${run.initialState}' not yet implemented.`)
      }

      if (failures.length === lastItems.length) {
        resultType = 'All Failed'
      } else if (failures.length > 0 && success.length > 0) {
        resultType = 'Partly Fail'
      } else {
        resultType = 'No Progress'
      }

      step = `FAILED_AFTER_${run.finalState}`

      // Pass last known items for further investigation.
      items = lastSuccess?.items || []
    }

    // Collect the results.
    const result = {
      result: resultType,
      step,
      run,
      done,
      total,
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
