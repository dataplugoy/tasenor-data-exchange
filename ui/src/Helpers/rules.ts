import { TFunction } from 'i18next'
import { MappingCondition } from '../Types/API/MappingCondition'
import { MappingFilterView } from '../Types/API/MappingFilterView'
import { MappingResultView } from '../Types/API/MappingResultView'
import { UnifiedItemData } from '../Types/API/UnifiedItemData'
import { RuleQuestion } from '../Types/API/RuleQuestion'

/**
 * An input line as presented to the rule editor.
 */
export type LineInfo = {
  key?: string
  time: string
  text: string
  total: number | null
  fields: Record<string, unknown>
}

export const TEXT_OPERATORS: MappingCondition['operator'][] = ['equals', 'contains', 'oneOf', 'regex']
export const AMOUNT_OPERATORS: MappingCondition['operator'][] = ['negative', 'positive', 'amountEquals', 'between']
export const ACTIONS: MappingResultView['action'][] = ['expense', 'income', 'tax', 'transfer', 'internalTransfer', 'skip']

// Field names used for counterparty in the drivers supporting mapping rules.
const COUNTERPARTY_FIELDS = ['Saaja/Maksaja', 'Saajan nimi']
const REFERENCE_FIELDS = ['Viite', 'Viitenumero']

export const DEFAULT_TEXT = '{Saaja/Maksaja} {Viesti}'

/**
 * Check if the operator uses the field.
 */
export function usesField(operator: MappingCondition['operator']): boolean {
  return TEXT_OPERATORS.includes(operator)
}

/**
 * Get a translated label for an operator.
 */
export function operatorLabel(t: TFunction, operator: MappingCondition['operator']): string {
  return t(`RULE_OPERATOR_${operator}`)
}

/**
 * Get a translated label for an action.
 */
export function actionLabel(t: TFunction, action: MappingResultView['action']): string {
  return t(`RULE_ACTION_${action}`)
}

/**
 * Get a label for an account code.
 */
export function accountLabel(t: TFunction, code: string | undefined): string {
  if (!code) {
    return ''
  }
  const account = /^ACCOUNT_(.*)$/.exec(code)
  if (account) {
    return t('Account {{number}}', { number: account[1] })
  }
  const bank = /^BANK_(.*)$/.exec(code)
  if (bank) {
    return t('Bank account {{account}}', { account: bank[1] })
  }
  const key = `ACCOUNT_${code}`
  const label = t(key)
  return label === key ? code : label
}

/**
 * Describe one condition.
 */
export function describeCondition(t: TFunction, condition: MappingCondition): string {
  const { field, operator, value } = condition
  switch (operator) {
    case 'negative':
    case 'positive':
      return operatorLabel(t, operator)
    case 'amountEquals':
      return `${operatorLabel(t, operator)} ${value}`
    case 'between':
      return `${operatorLabel(t, operator)} ${value instanceof Array ? value.join(' – ') : value}`
    case 'oneOf':
      return `${field} ${operatorLabel(t, operator)} ${value instanceof Array ? value.join(', ') : value}`
    default:
      return `${field} ${operatorLabel(t, operator)} "${value}"`
  }
}

/**
 * Describe all conditions of a rule.
 */
export function describeConditions(t: TFunction, view: MappingFilterView | undefined): string {
  if (!view || !view.conditions || view.conditions.length === 0) {
    return t('All lines')
  }
  return view.conditions.map(c => describeCondition(t, c)).join(', ')
}

/**
 * Trim spaces around each line, join the lines with the separator, squeeze repeated spaces to one and remove
 * non-printable characters.
 * Same as in the backend mapping compiler.
 */
export function cleanText(s: string, separator: string): string {
  return s.split(/\r?\n/).map(line => line.trim()).join(separator).replace(/\s+/g, ' ').replace(/\p{C}/gu, '').trim()
}

/**
 * Describe the action of a rule.
 */
export function describeAction(t: TFunction, view: MappingResultView | undefined, questions: RuleQuestion[] = []): string {
  if (!view) {
    return ''
  }
  const parts = [actionLabel(t, view.action)]
  if (view.account) parts.push(accountLabel(t, view.account))
  if (view.service) parts.push(view.service)
  if (view.vat && view.vat.mode === 'rate') parts.push(t('VAT {{rate}}%', { rate: view.vat.rate }))
  if (view.tags && view.tags.length) parts.push(view.tags.map(tag => `[${tag}]`).join(''))
  const asked = (view.ask || []).map(id => questions.find(q => q.id === id)?.label || `#${id}`)
  if (asked.length) parts.push(t('asks {{questions}}', { questions: asked.join(', ') }))
  return parts.join(', ')
}

/**
 * Generate a name for a rule from its conditions.
 */
export function suggestName(t: TFunction, view: MappingFilterView): string {
  return describeConditions(t, view).substring(0, 120)
}

/**
 * Get the first non-empty field from the list.
 */
function firstField(fields: Record<string, unknown>, names: string[]): [string, string] | null {
  for (const name of names) {
    if (fields[name] !== undefined && fields[name] !== null && `${fields[name]}` !== '') {
      return [name, `${fields[name]}`]
    }
  }
  return null
}

/**
 * The counterparty of a line if known.
 */
export function counterparty(line: LineInfo): string {
  const party = firstField(line.fields, COUNTERPARTY_FIELDS)
  return party ? party[1] : ''
}

/**
 * Suggest conditions matching a line and similar lines.
 */
export function conditionsFromLine(line: LineInfo): MappingFilterView {
  const conditions: MappingCondition[] = []
  const party = firstField(line.fields, COUNTERPARTY_FIELDS)
  if (party) {
    conditions.push({ field: party[0], operator: 'equals', value: party[1] })
  } else if (line.text) {
    conditions.push({ field: 'text', operator: 'equals', value: line.text })
  }
  const reference = firstField(line.fields, REFERENCE_FIELDS)
  if (reference) {
    conditions.push({ field: reference[0], operator: 'equals', value: reference[1] })
  }
  if (line.total !== null) {
    conditions.push({ field: '', operator: line.total < 0 ? 'negative' : 'positive' })
  }
  return { conditions }
}

/**
 * Suggest an action for a line.
 */
export function actionFromLine(line: LineInfo): MappingResultView {
  return {
    action: line.total !== null && line.total > 0 ? 'income' : 'expense',
    account: '',
    text: DEFAULT_TEXT,
    tags: [],
    vat: { mode: 'none' },
  }
}

/**
 * Fill in a text template with the fields of a line.
 */
export function fillTemplate(template: string, line: LineInfo): string {
  return template.replace(/\{([^{}]+)\}/g, (_, name) => {
    const value = name === 'text' ? line.text : line.fields[name]
    return value === undefined || value === null ? '' : `${value}`
  }).trim()
}

/**
 * Convert an action to a one-off answer for a line. Works like the compiled rule would.
 */
export function actionToUnified(view: MappingResultView, line: LineInfo): UnifiedItemData {
  const total = line.total || 0
  if (view.action === 'skip') {
    return { type: 'skip' }
  }
  const data: UnifiedItemData = {
    type: total < 0 ? 'expense' : 'income',
    value: Math.abs(total),
    text: fillTemplate(view.text || DEFAULT_TEXT, line),
  }
  switch (view.action) {
    case 'transfer':
      data.type = total < 0 ? 'withdrawal' : 'deposit'
      data.service = view.service
      break
    case 'internalTransfer':
      data.account = 'TRANSFER_INTERNAL'
      break
    default:
      data.account = view.account
  }
  if (view.tags && view.tags.length) {
    data.tags = view.tags
  }
  if (view.vat && view.vat.mode === 'rate' && view.vat.rate) {
    data.taxType = 'vat'
    data.taxPercentage = view.vat.rate
  }
  return data
}

/**
 * Check if the action has all the information it needs.
 */
export function isActionComplete(view: MappingResultView, questions: RuleQuestion[] = []): boolean {
  switch (view.action) {
    case 'expense':
    case 'income':
    case 'tax':
      // An account question gives the account, if the rule has none.
      if (!view.account && questions.some(q => q.kind === 'ACCOUNT' && (view.ask || []).includes(q.id))) {
        return true
      }
      return !!view.account && /^(ACCOUNT|EXPENSE|INCOME|TAX)_[A-Z0-9_]+$/.test(view.account)
    case 'transfer':
      return !!view.service
    default:
      return true
  }
}

/**
 * Remove empty optional parts before sending to the server.
 */
export function cleanAction(view: MappingResultView): MappingResultView {
  const ret: MappingResultView = { action: view.action }
  if (view.action === 'skip') {
    return ret
  }
  if (['expense', 'income', 'tax'].includes(view.action) && view.account) ret.account = view.account
  if (view.action === 'transfer' && view.service) ret.service = view.service
  ret.text = view.text || DEFAULT_TEXT
  if (view.tags && view.tags.length) ret.tags = view.tags
  if (view.vat && view.vat.mode === 'rate' && ['expense', 'income'].includes(view.action)) ret.vat = view.vat
  if (view.ask && view.ask.length) ret.ask = view.ask
  return ret
}
