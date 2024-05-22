import { Alert } from '../API/Alert'
import { AlertMethod } from '../API/AlertMethod'
import { AlertType } from '../API/AlertType'
import { Question } from '../API/Question'

export class QuestionsAlert implements Alert {

  id: number
  userId: number
  type: AlertType
  method: AlertMethod
  url: string
  payload: string
  delivered: null | string
  created?: string
  updated?: string
  questions: Question[]

  constructor(alert: Alert) {
    Object.assign(this, alert)
    this.questions = JSON.parse(alert.payload)
  }
}
