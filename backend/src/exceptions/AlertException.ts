import prisma from '@prisma/client'
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
