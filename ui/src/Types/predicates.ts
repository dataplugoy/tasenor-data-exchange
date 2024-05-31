import { OutputItem } from './API/OutputItem'

export function isOutputItem(obj: unknown): obj is OutputItem {

  if (typeof obj !== 'object' || obj === null) {
    return false
  }

  if (!('data' in obj)) return false
  if (!('delivered' in obj)) return false
  if (!('remoteId' in obj)) return false
  if (!('skipped' in obj)) return false
  if (!('unifiedId' in obj)) return false
  if (!('flowPlanId' in obj)) return false
  if (!('batchId' in obj)) return false
  if (!('runId' in obj)) return false

  return true
}
