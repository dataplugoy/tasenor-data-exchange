/**
 * Downloaded rule files of a flow plan.
 */
import { Rule } from '../Types/API/Rule'
import { RuleQuestion } from '../Types/API/RuleQuestion'
import { MappingResultView } from '../Types/API/MappingResultView'

/**
 * A question in a rules file. The ID is the ID in the project the file was downloaded from.
 */
export type RulesFileQuestion = Pick<RuleQuestion, 'id' | 'name' | 'kind' | 'label' | 'options'>

/**
 * Content of a downloaded rules file.
 */
export interface RulesFile {
  version: number | null
  saved: string | null
  rules: Partial<Rule>[]
  questions: RulesFileQuestion[]
}

/**
 * Changes to the questions of the project needed to upload a rules file.
 */
export interface QuestionChanges {
  create: RulesFileQuestion[]
  update: { question: RulesFileQuestion, id: number }[]
  // Mapping from the question IDs in the file to the IDs of the existing questions.
  ids: Record<number, number>
}

/**
 * IDs of the questions asked by a rule.
 */
function asked(rule: Partial<Rule>): number[] {
  return (rule.resultView as unknown as MappingResultView | undefined)?.ask || []
}

/**
 * Build a rules file from the rules and the project questions they ask.
 */
export function makeRulesFile(version: number, saved: string | null, rules: Rule[], questions: RuleQuestion[]): RulesFile {
  const used = new Set(rules.map(asked).flat())
  return {
    version,
    saved,
    rules: rules.map(rule => {
      const { filter, name, key, result, kind, enabled, notes, filterView, resultView } = rule
      return { filter, name, key, result, kind, enabled, notes, filterView, resultView }
    }),
    questions: questions.filter(q => used.has(q.id)).map(({ id, name, kind, label, options }) => ({ id, name, kind, label, options })),
  }
}

/**
 * Parse the content of a rules file.
 * Files downloaded before versioning are plain lists of rules and older files have no questions.
 * @returns The file or null if the content is not a rules file.
 */
export function parseRulesFile(json: unknown): RulesFile | null {
  if (Array.isArray(json)) {
    return { version: null, saved: null, rules: json, questions: [] }
  }
  if (!json || typeof json !== 'object' || !Array.isArray((json as RulesFile).rules)) {
    return null
  }
  const file = json as RulesFile
  return {
    version: typeof file.version === 'number' ? file.version : null,
    saved: file.saved || null,
    rules: file.rules,
    questions: Array.isArray(file.questions) ? file.questions : [],
  }
}

/**
 * Compare the questions of a file to the questions of the project by name.
 */
export function questionChanges(file: RulesFile, existing: RuleQuestion[]): QuestionChanges {
  const changes: QuestionChanges = { create: [], update: [], ids: {} }
  for (const question of file.questions) {
    const old = existing.find(q => q.name === question.name)
    if (!old) {
      changes.create.push(question)
      continue
    }
    changes.ids[question.id] = old.id
    const content = (q: RulesFileQuestion) => JSON.stringify({ kind: q.kind, label: q.label, options: q.options })
    if (content(old) !== content(question)) {
      changes.update.push({ question, id: old.id })
    }
  }
  return changes
}

/**
 * Change the question IDs asked by the rules using the given mapping.
 */
export function remapQuestions(rules: Partial<Rule>[], ids: Record<number, number>): Partial<Rule>[] {
  return rules.map(rule => {
    const ask = asked(rule)
    if (!ask.length) {
      return rule
    }
    const resultView = { ...(rule.resultView as unknown as MappingResultView), ask: ask.map(id => ids[id] ?? id) }
    return { ...rule, resultView } as Partial<Rule>
  })
}
