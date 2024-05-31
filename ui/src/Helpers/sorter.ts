import { InputItem } from '../Types/API/InputItem'
import { ItemError } from '../Types/API/ItemError'
import { OutputItem } from '../Types/API/OutputItem'
import { Run } from '../Types/API/Run'
import { UnifiedItem } from '../Types/API/UnifiedItem'

export type ResultInputItem = { type: 'InputItem', error: null | ItemError } & InputItem
export type ResultUnifiedItem = { type: 'UnifiedItem', error: null | ItemError } & UnifiedItem
export type ResultOutputItem = { type: 'OutputItem', error: null | ItemError } & OutputItem

export type ResultItem = ResultInputItem | ResultUnifiedItem | ResultOutputItem

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

export type RunStepResult = {
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
  outputs: Record<number, OutputItem[]>,
  errors: ItemError[]): RunStepResult[] {

  const results: RunStepResult[] = []
  let lastSuccess: null | RunStepResult = null

  // Sort out errors per run and item.
  const sortedErrors: Record<number, Record<number, ItemError>> = {}
  errors.forEach(err => {
    sortedErrors[err.runId] = sortedErrors[err.runId] || {}
    sortedErrors[err.runId][err.itemId] = err
  })
  function err(run, item) {
    if (sortedErrors[run.id] && sortedErrors[run.id][item.id]) {
      return sortedErrors[run.id][item.id]
    }
    return null
  }

  // Handle in chronological order.
  for (let i = runs.length - 1; i >= 0; i--) {
    const run = runs[i]
    let step: RunStepType = 'FAILED_AFTER_BATCH_CREATED'
    let items: ResultItem[] = []
    const hasProgressed = (run.initialState !== run.finalState);

    // Categorize items and put them together.
    (inputs[run.id] || []).forEach((item: InputItem) => {
      items.push({ type: 'InputItem', ...item, error: err(run, item) })
    });
    (unifieds[run.id] || []).forEach(item => {
      items.push({ type: 'UnifiedItem', ...item, error: err(run, item) })
    });
    (outputs[run.id] || []).forEach(item => {
      items.push({ type: 'OutputItem', ...item, error: err(run, item) })
    })

    if (hasProgressed) {
      step = `SUCCESSFUL_${run.finalState}`
      if (run.finalState === 'OUTPUT_DELIVERED') {
        items = lastSuccess?.items || []
      }
    } else if (run.result === 'WAITING') {
      // Nothing to do, keep the items collected so far.
    } else {
      // Pass last known items for further investigation.
      step = `FAILED_AFTER_${run.finalState}`
      items = (lastSuccess?.items || []).map(item => ({ ...item, error: err(run, item) }))
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
