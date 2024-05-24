import { AlertException } from './AlertException'
import { Question } from '../types/API/Question'
import { Notes } from '../types/API/Notes'

/**
 * Collection of variables.
 */
export const VARIABLES: Record<string, Omit<Question, 'variable'>> = {
  allowShortSelling: {
    type: 'BOOLEAN',
    help: 'We have found out that you are trying to sell something you don\'t own. It may be a mistake, but it can also be possible with some service providers to loan an instrument for selling.',
    label: 'Allow short selling'
  },
  inputDuplicates: {
    type: 'ENUM',
    help: 'There has been more than one copy of the identical items received. Do we want to include them nevertheless?',
    label: 'What to do with input duplicates?',
    args: {
      options: ['Always', 'Never', 'Ask']
    }
  }
}

export class AnswersRequired extends AlertException<Question[]> {
  constructor(url: string, userId: number, question: Question | Question[]) {
    super('ANSWERS_REQUIRED', url, userId, question instanceof Array ? question : [question])
  }

  notes(): Notes {
    return {
      needSettings: this.payload.map(payload => payload.variable)
    }
  }

  /**
   * Instantiate
   * @param variable
   */
  static throw(url: string, userId: number, variable: string): never {
    if (!VARIABLES[variable]) {
      throw new Error(`Bad variable name '${variable}'.`)
    }
    // TODO: Localize here.
    // TODO: Scan texts above in i18n tool.
    const question = {
      type: VARIABLES[variable].type,
      help: VARIABLES[variable].help,
      label: VARIABLES[variable].label,
      args: VARIABLES[variable].args,
      variable
    }
    const alert = new AnswersRequired(url, userId, question)
    throw alert
  }
}
