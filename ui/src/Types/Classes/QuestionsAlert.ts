import { Alert } from '../API/Alert'
import { Question } from '../API/Question'
import { UIAlert } from './UIAlert'

export class QuestionsAlert extends UIAlert {

  questions: Question[]

  constructor(alert: Alert) {
    super(alert)
    this.questions = JSON.parse(alert.payload)
  }

  run() {
    alert('TODO')
  }
}
