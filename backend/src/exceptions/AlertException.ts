import prisma from '@prisma/client'
import { Question } from '../types/API/Question'

/**
 * Catchable error to deliver an alert.
 */
export class AlertException<T = string> extends Error {
  type: prisma.AlertType
  url: string
  payload: T
  userId: number

  constructor(type: prisma.AlertType, url: string, userId: number, payload: T) {
    super(`Alert: ${payload}`)
    this.type = type
    this.url = url
    this.payload = payload
    this.userId = userId
  }
}

/**
 * Need to upload a file to continue.
 */
export class UploadRequired extends AlertException {
  constructor(url: string, userId: number, message: string) {
    super('UPLOAD_REQUIRED', url, userId, message)
  }
}

export class AnswersRequired extends AlertException<Question[]> {
  constructor(url: string, userId: number, question: Question | Question[]) {
    super('ANSWERS_REQUIRED', url, userId, question instanceof Array ? question : [question])
  }
}
