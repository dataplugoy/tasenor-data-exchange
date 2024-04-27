import { Alert } from './API/Alert'

export function isAlert(obj: unknown): obj is Alert {
  if (typeof obj !== 'object' || obj === null) {
    return false
  }

  if (!('userId' in obj) ||
    !('type' in obj) ||
    !('method' in obj) ||
    !('url' in obj) ||
    !('payload' in obj)) {
    return false
  }

  // TODO: Get list of types and methods from somewhere.
  return ['UPLOAD_REQUIRED'].includes((obj as object).type) &&
    ['INTERACTIVE', 'EMAIL'].includes((obj as object).method)
}
