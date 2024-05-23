import prisma from '@prisma/client'
import { Question } from '../types/API/Question'
import { Notes } from '../types/API/Notes'

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

  toString() {
    return `${this.constructor.name}(${JSON.stringify(this.payload)})`
  }

  notes(): Notes {
    return {}
  }
}

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

export class AnswersRequired extends AlertException<Question[]> {
  constructor(url: string, userId: number, question: Question | Question[]) {
    // TODO: Consider some sort of database that you can just give variable name here and fill in types and details.
    super('ANSWERS_REQUIRED', url, userId, question instanceof Array ? question : [question])
  }

  notes(): Notes {
    return {
      needSettings: this.payload.map(payload => payload.variable)
    }
  }
}
