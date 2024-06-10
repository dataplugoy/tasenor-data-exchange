import { AlertException } from './AlertException'
import { Question } from '../types/API/Question'
import { Notes } from '../types/API/Notes'
import { AccountCode } from '../types/AccountCode'
import { Language } from '@tasenor/common'
import { t } from '../lib/i18n/t'

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
    label: 'Include input duplicates',
    args: {
      options: ['Always', 'Never', 'Ask']
    }
  },
  outputDuplicates: {
    type: 'ENUM',
    help: 'There has been more than one copy of the identical resulting transaction created. It is probably normal, but just in case you want it to behave otherwise...',
    label: 'Create transaction duplicates',
    args: {
      options: ['Always', 'Never', 'Ask']
    }
  },
  allowInputFromPast: {
    type: 'ENUM',
    help: 'We encountered an item that has older time stamp than what we have processed earlier. Do we include them?',
    label: 'Include entries from past',
    args: {
      options: ['Always', 'Never', 'Ask']
    }
  },
  skipDeposits: {
    type: 'BOOLEAN',
    help: 'If deposits to the accounts in this service are imported from some other source than this, they should be skipped when processing here.',
    label: 'Skip deposits',
  },
  skipWithdrawals: {
    type: 'BOOLEAN',
    help: 'If withdrawals from the accounts in this service are imported from some other source than this, they should be skipped when processing here.',
    label: 'Skip withdrawals',
  },
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
   * Instantiate and throw.
   * @param variable
   */
  static throw(url: string, language: Language, userId: number, variable: string): never {
    if (!VARIABLES[variable]) {
      throw new Error(`Bad variable name '${variable}'.`)
    }
    const question: Question = {
      type: VARIABLES[variable].type,
      help: t(language, VARIABLES[variable].help),
      label: t(language, VARIABLES[variable].label),
      args: VARIABLES[variable].args,
      variable: `settings.${variable}`
    }
    const alert = new AnswersRequired(url, userId, question)
    throw alert
  }

  /**
   * Throw for a set of accounts.
   * @param url
   * @param userId
   * @param accounts
   */
  static forAccounts(url: string, language: Language, userId: number, destinationId: number, accounts: Set<AccountCode>): never {
    const questions: Question[] = []

    for (const account of accounts) {

      questions.push({
        type: 'ACCOUNT',
        help: '',
        label: '',
        args: {
          destinationId
        },
        variable: `accounts.${account}`
      })
    }

    const alert = new AnswersRequired(url, userId, questions)
    throw alert
  }
}
