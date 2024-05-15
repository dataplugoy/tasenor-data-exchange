import { Alert } from './API/Alert'
import { UploadAlert } from './Classes/UploadAlert'

/**
 * Check if an object is Alert data.
 * @param obj
 * @returns
 */
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

  return obj.method === 'INTERACTIVE'
}

/**
 * Instantiate selected alert class.
 * @param alert
 */
export function getAlert(alert: Alert) {
  if (alert.type === 'UPLOAD_REQUIRED') {
    return new UploadAlert(alert)
  }
}
