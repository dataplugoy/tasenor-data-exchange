/**
 * Helpers for the rule editor: fields of recent input items and previews of rules.
 */
import prisma from '@prisma/client'
import { DateTime } from 'luxon'
import { Timestring } from '@tasenor/common'
import { InputItemModel } from '../models/InputItemModel'
import { RuleModel } from '../models/RuleModel'
import { FlowPlanModel } from '../models/FlowPlanModel'
import { InputDriver } from '../driver/InputDriver'
import { Analyzer } from './analyzer/Analyzer'
import { Stock } from './Stock'
import { AlertException } from '../exceptions/AlertException'
import { evaluateRule, ruleMatches } from './rules'
import { SaveRuleRequest } from '../types/API/flow-plans/SaveRuleRequest'
import { UnifiedItemData } from '../types/API/UnifiedItemData'
import { Setup } from '../types/API/Setup'
import { Question } from '../types/API/Question'
import { RulePreviewResponse, RulePreviewMatch } from '../types/API/flow-plans/RulePreviewResponse'
import { RuleFieldsResponse } from '../types/API/flow-plans/RuleFieldsResponse'
import { ProjectSettings } from '../types/API/Project'
import { defaultAnswers, mergeAnswers } from './questions'
import { RuleQuestionModel } from '../models/RuleQuestionModel'

// Number of latest input items used.
const RECENT = 500
// Maximum number of matches returned.
const MAX_MATCHES = 100
// Maximum number of example values per field.
const MAX_EXAMPLES = 20

/**
 * Get the latest input items of the flow plan.
 */
export async function recentInputs(flowPlanId: number): Promise<InputItemModel[]> {
  const items = await InputItemModel.db.findMany({ where: { flowPlanId }, orderBy: [{ id: 'desc' }], take: RECENT })
  return items.map((item: prisma.InputItem) => InputItemModel.instantiate<prisma.InputItem, InputItemModel>(item))
}

/**
 * Collect field names and example values from input items.
 */
export function collectFields(inputs: InputItemModel[]): RuleFieldsResponse {
  const examples: Record<string, Map<string, number>> = {}
  for (const input of inputs) {
    for (const [name, value] of Object.entries(input.fields)) {
      if (value === null || value === undefined || value === '' || typeof value === 'object') {
        continue
      }
      examples[name] = examples[name] || new Map()
      const text = `${value}`
      examples[name].set(text, (examples[name].get(text) || 0) + 1)
    }
  }
  return Object.keys(examples).sort().map(name => ({
    name,
    // Most common values first.
    examples: [...examples[name].entries()].sort((a, b) => b[1] - a[1]).slice(0, MAX_EXAMPLES).map(e => e[0]),
  }))
}

/**
 * Time stamp of an input item as used in unified items.
 */
function inputTime(input: InputItemModel): Timestring {
  const time = input.time as string
  return (/^\d{4}-\d{2}-\d{2}$/.test(time) ? `${time}T12:00:00.000Z` : DateTime.fromISO(time).toUTC().toISO()) as Timestring
}

/**
 * Describe questions of an alert as a note.
 */
function alertNote(err: AlertException<unknown>): string {
  const questions = err.payload instanceof Array ? err.payload as Question[] : []
  return questions.length ? questions.map(q => q.label || q.variable).join(', ') : err.message
}

/**
 * Evaluate a rule being edited against recent input items.
 * @param ruleId Existing rule being edited or null for a new rule, which goes last.
 * @throws MappingError if the rule is invalid.
 */
export async function previewRule(flow: FlowPlanModel, driver: InputDriver, request: SaveRuleRequest, ruleId: number | null): Promise<RulePreviewResponse> {
  const rule = RuleModel.fromRequest(request)
  const rules = await RuleModel.findForFlow(flow.id, `${driver.constructor.name}.json`)
  const index = ruleId === null ? -1 : rules.findIndex(r => r.id === ruleId)
  const earlier = (index < 0 ? rules.filter(r => r.id !== ruleId) : rules.slice(0, index)).filter(r => r.data.enabled !== false)
  const inputs = await recentInputs(flow.id)
  const setup = flow.data.setup as Setup
  const matches: RulePreviewMatch[] = []
  let count = 0

  // Questions are answered with the defaults.
  const ask = request.resultView?.ask || []
  const questions = ask.length ? await RuleQuestionModel.findForFlowPlan(flow.id) : {}
  const defaults = defaultAnswers(setup, ruleId, ask)

  for (const input of inputs) {
    const variables = driver.ruleVariables(input)
    let result: UnifiedItemData | undefined
    try {
      result = evaluateRule<UnifiedItemData>(variables, rule as { filter: unknown, result: unknown })
    } catch (err) {
      matches.length < MAX_MATCHES && matches.push(describe(input, driver, null, null, `${err.message}`, null))
      count++
      continue
    }
    if (result === undefined) {
      continue
    }
    count++
    if (matches.length >= MAX_MATCHES) {
      continue
    }
    if (ask.length) {
      mergeAnswers(result, defaults)
    }
    driver.completeUnified(input, result)

    const shadow = earlier.find(r => {
      try {
        return ruleMatches(variables, r.data.filter)
      } catch (err) {
        return false
      }
    })

    let lines: RulePreviewMatch['lines'] = null
    let note: string | null = null
    try {
      const analyzer = new Analyzer(driver.projectSettings as ProjectSettings, new Stock({}), {}, setup, { userId: driver.options.userId, flowPlanId: flow.id })
      const time = inputTime(input)
      const tx = await analyzer.analyze(DateTime.fromISO(time), Analyzer.data2model(time, result))
      lines = tx.lines.map(line => ({ account: line.account, amount: `${line.amount}`, text: line.text }))
    } catch (err) {
      note = err instanceof AlertException ? alertNote(err) : `${err.message}`
    }
    matches.push(describe(input, driver, result, lines, note, shadow ? shadow.name : null))
  }

  const response: RulePreviewResponse = { checked: inputs.length, count, matches }
  if (ask.length) {
    response.asked = ask.map(id => questions[id] ? questions[id].data.label : `#${id}`)
  }
  return response
}

/**
 * Construct a preview entry.
 */
function describe(input: InputItemModel, driver: InputDriver, result: UnifiedItemData | null, lines: RulePreviewMatch['lines'], note: string | null, shadowedBy: string | null): RulePreviewMatch {
  return {
    key: driver.answerKey(input),
    time: input.time as string,
    text: input.text || '',
    total: input.total as number,
    fields: input.fields,
    result,
    lines,
    note,
    shadowedBy,
  }
}
