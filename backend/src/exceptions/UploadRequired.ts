import { AlertException } from './AlertException'
import { Notes } from '../types/API/Notes'

/**
 * Need to upload a file to continue.
 */
export class UploadRequired extends AlertException {
  constructor(url: string, userId: number, message: string) {
    super('UPLOAD_REQUIRED', url, userId, message)
  }

  notes(): Notes {
    return {
      needUpload: true
    }
  }
}
