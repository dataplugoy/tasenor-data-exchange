import { AlertException } from './AlertException'
import { Question } from '../types/API/Question'
import { Notes } from '../types/API/Notes'
import { AccountCode } from '../types/AccountCode'
import { Currency, Language } from '@tasenor/common'
import { t } from '../lib/i18n/t'
import { QuestionType } from '../types/API/QuestionType'
import { QuestionExample } from '../types/API/QuestionExample'
import { RuleQuestion } from '../types/API/RuleQuestion'
import { RuleQuestionAnswer } from '../types/API/RuleQuestionAnswer'
import { OpeningState } from '../types/API/OpeningState'

/**
 * Collection of variables.
 */
export const VARIABLES: Record<string, Question> = {
  allowShortSelling: {
    variable: 'allowShortSelling',
    type: 'BOOLEAN',
    help: 'We have found out that you are trying to sell something you don\'t own. It may be a mistake, but it can also be possible with some service providers to loan an instrument for selling.',
    label: 'Allow short selling'
  },
  inputDuplicates: {
    variable: 'inputDuplicates',
    type: 'ENUM',
    help: 'There has been more than one copy of the identical items received. Do we want to include them nevertheless?',
    label: 'Include input duplicates',
    args: {
      options: ['Always', 'Never']
    }
  },
  outputDuplicates: {
    variable: 'outputDuplicates',
    type: 'ENUM',
    help: 'There has been more than one copy of the identical resulting transaction created. It is probably normal, but just in case you want it to behave otherwise...',
    label: 'Create transaction duplicates',
    args: {
      options: ['Always', 'Never']
    }
  },
  allowInputFromPast: {
    variable: 'allowInputFromPast',
    type: 'ENUM',
    help: 'We encountered an item that has older time stamp than what we have processed earlier. Do we include them?',
    label: 'Include entries from past',
    args: {
      options: ['Always', 'Never']
    }
  },
  skipDeposits: {
    variable: 'skipDeposits',
    type: 'BOOLEAN',
    help: 'If deposits to the accounts in this service are imported from some other source than this, they should be skipped when processing here.',
    label: 'Skip deposits',
  },
  skipWithdrawals: {
    variable: 'skipWithdrawals',
    type: 'BOOLEAN',
    help: 'If withdrawals from the accounts in this service are imported from some other source than this, they should be skipped when processing here.',
    label: 'Skip withdrawals',
  },
  tags: {
    variable: 'tags',
    type: 'STRINGS',
    help: 'Optional comma- or semicolon separated list of tags to be added every transaction created by this flow plan.',
    label: 'Additional tags'
  },
}

export type GroupingVariable = 'singleProfitAccount' | 'singleLossAccount' | 'singleFeeAccount'

/**
 * Questions about recording accounts of one kind to a single account.
 */
const GROUPING_QUESTIONS: Record<GroupingVariable, { help: string, label: string }> = {
  singleProfitAccount: {
    help: 'Trading {{asset}} makes profit. Do we record profits of all assets to the same account, or to a separate account for each asset?',
    label: 'Record profits of all assets to the same account',
  },
  singleLossAccount: {
    help: 'Trading {{asset}} makes loss. Do we record losses of all assets to the same account, or to a separate account for each asset?',
    label: 'Record losses of all assets to the same account',
  },
  singleFeeAccount: {
    help: 'A fee is charged in {{asset}}. Do we record fees in all currencies to the same account, or to a separate account for each currency?',
    label: 'Record fees in all currencies to the same account',
  },
}

/**
 * Description of an input item no rule matches.
 */
export type UnmatchedItem = {
  key: string
  line: number
  time: string
  text: string
  total: number
  fields: Record<string, unknown>
}

/**
 * Description of an input item matched by a rule asking questions.
 */
export type RuleQuestionsItem = UnmatchedItem & {
  ruleId: number
  ruleName: string
  // IDs of the questions to ask.
  ask: number[]
  // Default answers by question ID.
  defaults: Record<string, RuleQuestionAnswer>
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
  static throw(url: string, language: Language, userId: number, variable: string, example: null | QuestionExample = null): never {
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
    if (example) {
      question.example = example
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

  /**
   * Ask if profits, losses or fees are recorded to one account or to a separate account for each asset.
   * @param url
   * @param language
   * @param userId
   * @param asking Asset or currency seen first for each grouping variable to ask.
   */
  static forAccountGrouping(url: string, language: Language, userId: number, asking: Partial<Record<GroupingVariable, string>>): never {
    const questions: Question[] = Object.entries(asking).map(([variable, asset]) => ({
      type: 'BOOLEAN',
      help: t(language, GROUPING_QUESTIONS[variable].help, { asset }),
      label: t(language, GROUPING_QUESTIONS[variable].label),
      variable: `accountGrouping.${variable}`
    }))
    const alert = new AnswersRequired(url, userId, questions)
    throw alert
  }

  /**
   * Ask if debt should be recorded for an account.
   * @param url
   * @param language
   * @param account
   */
  static forDebt(url: string, language: Language, userId: number, destinationId: number, currency: Currency) {
    const args = {
      destinationId,
      currency,
    }

    const question = {
      type: 'DEBT_ACCOUNT' as QuestionType,
      help: t(language, 'Currency account for {{currency}} is going to have negative balance. Do we want to record negative balance to the separate debt account?', args),
      label: t(language, 'Use separate debt account'),
      args,
      variable: 'settings.debtAccounts'
    }
    const alert = new AnswersRequired(url, userId, question)
    throw alert
  }

  /**
   * Ask how to handle input items that no rule matches and the questions of the rules matching input items.
   * @param url
   * @param language
   * @param userId
   * @param flowPlanId Flow plan, where rules can be added.
   * @param unmatched Unmatched items with the key to use for one-off answers.
   * @param asking Items matched by rules asking questions.
   * @param questions The questions asked.
   */
  static forLines(url: string, language: Language, userId: number, flowPlanId: number, unmatched: UnmatchedItem[], asking: RuleQuestionsItem[], questions: RuleQuestion[]): never {
    const list: Question[] = []
    if (unmatched.length) {
      list.push({
        type: 'UNMATCHED_LINE' as QuestionType,
        help: t(language, 'No rule matches {{count}} lines. Create a rule for them, or tell how to handle each line once.', { count: unmatched.length }),
        label: t(language, 'Unmatched lines'),
        args: { flowPlanId, items: unmatched },
        variable: 'answers'
      })
    }
    if (asking.length) {
      list.push({
        type: 'RULE_QUESTIONS' as QuestionType,
        help: t(language, 'Rules matching {{count}} lines ask questions for each line.', { count: asking.length }),
        label: t(language, 'Questions of the rules'),
        args: { flowPlanId, items: asking, questions },
        variable: 'lineAnswers'
      })
    }
    const alert = new AnswersRequired(url, userId, list)
    throw alert
  }

  /**
   * Ask to confirm the opening balances and assets of the first batch.
   * @param url
   * @param language
   * @param userId
   * @param openingState The proposed balances and assets.
   * @param currency Currency of the project.
   */
  static forOpeningState(url: string, language: Language, userId: number, openingState: OpeningState, currency: Currency): never {
    const sources = openingState.sources.length ? openingState.sources.join(', ') : t(language, 'the values entered earlier')
    const question: Question = {
      type: 'OPENING_STATE',
      help: t(language, 'Before the first transactions on {{date}} the accounts had the following balances and assets according to {{sources}}. Check and correct them, if needed.', { date: openingState.date, sources }),
      label: t(language, 'Opening balances and assets'),
      args: { openingState, currency },
      variable: 'openingState'
    }
    const alert = new AnswersRequired(url, userId, question)
    throw alert
  }

  /**
   * Check if ticker needs to be replaced.
   * @param url
   * @param language
   * @param userId
   * @param ticker
   */
  static forTicker(url: string, language: Language, userId: number, ticker: string) {
    const question = {
      type: 'TICKER' as QuestionType,
      help: t(language, 'We have found a ticker "{{ticker}}" which does not sound proper ticker name? Do you want to replace it with something else?', { ticker }),
      label: t(language, 'Replacement ticker'),
      args: { ticker },
      variable: 'tickers'
    }

    const alert = new AnswersRequired(url, userId, question)
    throw alert
  }
}
