import prisma from '@prisma/client'

/**
 * Catchable error to deliver an alert.
 */
export class AlertException extends Error {
  type: prisma.AlertType
  url: string
  payload: string

  constructor(type: prisma.AlertType, url: string, payload: string) {
    super(`Alert: ${payload}`)
    this.type = type
    this.url = url
    this.payload = payload
  }
}

/**
 * Need to upload a file to continue.
 */
export class UploadRequired extends AlertException {
  constructor(url: string, message: string) {
    super('UPLOAD_REQUIRED', url, message)
  }
}
