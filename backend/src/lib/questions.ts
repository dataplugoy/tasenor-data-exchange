/**
 * Questions of mapping rules asked for each matching line.
 */
import { RuleModel } from '../models/RuleModel'
import { UnifiedItemData } from '../types/API/UnifiedItemData'
import { RuleQuestionAnswer } from '../types/API/RuleQuestionAnswer'
import { MappingResultView } from '../types/API/MappingResultView'
import { Setup } from '../types/API/Setup'

/**
 * An error thrown when a rule asking questions matches a line without answers.
 */
export class RuleQuestionsRequired extends Error {
  rule: RuleModel

  constructor(rule: RuleModel) {
    super(`Rule '${rule.name}' needs answers to its questions.`)
    this.name = 'RuleQuestionsRequired'
    this.rule = rule
  }
}

/**
 * IDs of the questions asked by a rule.
 */
export function askedQuestions(rule: { resultView?: unknown } | null | undefined): number[] {
  return (rule?.resultView as MappingResultView | undefined)?.ask || []
}

/**
 * Fill in the answers to the result of a rule.
 *
 * Tags are added to the tags of the rule, an account replaces the account of the rule and a text replaces the
 * placeholder `{?name}` in the text, or is appended to the text if there is no placeholder. Placeholders left
 * without an answer are removed.
 */
export function mergeAnswers(data: UnifiedItemData, answers: Record<string, RuleQuestionAnswer>): void {
  let text = typeof data.text === 'string' ? data.text : ''
  for (const answer of Object.values(answers)) {
    if (answer.tags) {
      const tags = data.tags || []
      for (const tag of answer.tags) {
        if (!tags.includes(tag)) {
          tags.push(tag)
        }
      }
      data.tags = tags
    }
    if (answer.account) {
      data.account = answer.account as UnifiedItemData['account']
    }
    if (answer.text !== undefined) {
      const placeholder = `{?${answer.name}}`
      text = text.includes(placeholder) ? text.split(placeholder).join(answer.text) : `${text} ${answer.text}`.trim()
    }
  }
  if (typeof data.text === 'string' || text !== '') {
    data.text = text.replace(/\s*\{\?[^{}]*\}/g, '').trim()
  }
}

/**
 * Find default answers for the questions of a rule from the earlier answers.
 *
 * The latest answer to the same question for the same rule is used, or failing that, the latest answer to the same
 * question for any rule.
 */
export function defaultAnswers(setup: Setup | undefined, ruleId: number | null, questions: number[]): Record<string, RuleQuestionAnswer> {
  const sameRule: Record<string, RuleQuestionAnswer> = {}
  const anyRule: Record<string, RuleQuestionAnswer> = {}
  // Later entries are newer.
  for (const entry of Object.values(setup?.lineAnswers || {})) {
    for (const [id, answer] of Object.entries(entry.answers || {})) {
      anyRule[id] = answer
      if (entry.rule === ruleId) {
        sameRule[id] = answer
      }
    }
  }
  const defaults: Record<string, RuleQuestionAnswer> = {}
  for (const id of questions) {
    const answer = sameRule[id] || anyRule[id]
    if (answer) {
      defaults[id] = answer
    }
  }
  return defaults
}
