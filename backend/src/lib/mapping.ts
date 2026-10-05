/**
 * Compiler for mapping rules.
 *
 * A mapping rule is edited as a form: a list of conditions (`filterView`) and an action (`resultView`). This module
 * validates the form and compiles it to the `filter` and `result` expressions evaluated by the rules engine.
 */
import { MappingCondition } from '../types/API/MappingCondition'
import { MappingFilterView } from '../types/API/MappingFilterView'
import { MappingResultView } from '../types/API/MappingResultView'
import { UnifiedItemRule } from '../types/API/UnifiedItemRule'

export class MappingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MappingError'
  }
}

/**
 * Helper functions available in rule expressions in addition to the functions of the rules engine.
 */
export const RULE_HELPERS = {
  // Case-insensitive regular expression test returning always a boolean.
  matches: (re: string, s: unknown): boolean => new RegExp(re, 'i').test(`${s ?? ''}`),
  // Clean up text for comparison, see `cleanText()`.
  clean: (s: unknown, separator: string): string => cleanText(`${s ?? ''}`, separator),
}

/**
 * Trim spaces around each line, join the lines with the separator, squeeze repeated spaces to one and remove
 * non-printable characters.
 */
export function cleanText(s: string, separator: string): string {
  return s.split(/\r?\n/).map(line => line.trim()).join(separator).replace(/\s+/g, ' ').replace(/\p{C}/gu, '').trim()
}

/**
 * Quote a string as an expression literal.
 */
export function quote(s: string): string {
  return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`
}

/**
 * Expression for the value of a field as a string, cleaned with the line separator if given.
 */
function raw(field: string, separator: string | null = null): string {
  const value = `str($(${quote(field)}, ''))`
  return separator === null ? value : `clean(${value}, ${quote(separator)})`
}

/**
 * Expression for the value of a field as lower case string.
 */
function text(field: string, separator: string | null = null): string {
  return `lower(${raw(field, separator)})`
}

/**
 * Get a number from a condition value.
 */
function number(condition: MappingCondition, value: unknown): number {
  const n = typeof value === 'number' ? value : parseFloat(`${value}`.replace(',', '.'))
  if (isNaN(n)) {
    throw new MappingError(`Condition '${condition.operator}' needs a number, got ${JSON.stringify(value)}.`)
  }
  return n
}

/**
 * Get a non-empty string from a condition value.
 */
function string(condition: MappingCondition, value: unknown): string {
  if (typeof value !== 'string' || value === '') {
    throw new MappingError(`Condition '${condition.operator}' for field '${condition.field}' needs a text value.`)
  }
  return value
}

// Operators comparing text.
const TEXT_OPERATORS = ['equals', 'contains', 'oneOf', 'regex']

/**
 * Compile one condition.
 * @param separator If given, the field value is cleaned and line breaks replaced with it before comparing.
 */
function compileCondition(condition: MappingCondition, separator: string | null = null): string {
  const { field, operator, value } = condition
  switch (operator) {
    case 'equals':
      return `${text(field, separator)} == ${quote(string(condition, value).toLowerCase())}`
    case 'contains':
      return `contains(${text(field, separator)}, ${quote(string(condition, value).toLowerCase())})`
    case 'oneOf':
      if (!(value instanceof Array) || value.length === 0) {
        throw new MappingError(`Condition 'oneOf' for field '${field}' needs a list of values.`)
      }
      return `(${value.map(v => `${text(field, separator)} == ${quote(string(condition, v).toLowerCase())}`).join(' or ')})`
    case 'regex': {
      const re = string(condition, value)
      try {

        new RegExp(re)
      } catch (err) {
        throw new MappingError(`Invalid regular expression ${JSON.stringify(re)} for field '${field}'.`)
      }
      return `matches(${quote(re)}, ${separator === null ? `$(${quote(field)}, '')` : raw(field, separator)})`
    }
    case 'positive':
      return 'total > 0'
    case 'negative':
      return 'total < 0'
    case 'amountEquals':
      return `total == ${number(condition, value)}`
    case 'between': {
      if (!(value instanceof Array) || value.length !== 2) {
        throw new MappingError('Condition \'between\' needs two numbers.')
      }
      const [a, b] = value.map(v => number(condition, v))
      return `(total >= ${Math.min(a, b)} and total <= ${Math.max(a, b)})`
    }
  }
  throw new MappingError(`Unknown condition operator ${JSON.stringify(operator)}.`)
}

/**
 * Compile a text condition ignoring line breaks and extra spaces in the field and in the value.
 */
function compileTrimmed(condition: MappingCondition): string {
  const trim = (v: unknown) => typeof v === 'string' ? cleanText(v, '') : v
  const trimmed = { ...condition, value: condition.value instanceof Array ? condition.value.map(trim) : trim(condition.value) } as MappingCondition
  return compileCondition(trimmed, '')
}

/**
 * Compile the conditions of a mapping rule to a filter expression.
 */
export function compileFilter(view: MappingFilterView): string {
  if (!view.conditions.length) {
    return 'true'
  }
  return view.conditions.map(c => c.trimNewLines && TEXT_OPERATORS.includes(c.operator) ? compileTrimmed(c) : compileCondition(c)).join(' and ')
}

/**
 * Compile a text template like `{Saaja/Maksaja}: {Viesti}` to an expression.
 */
export function compileTemplate(template: string): string {
  const parts: string[] = []
  let rest = template
  while (rest !== '') {
    const match = /\{([^{}]+)\}/.exec(rest)
    if (!match) {
      parts.push(quote(rest))
      break
    }
    if (match.index > 0) {
      parts.push(quote(rest.substring(0, match.index)))
    }
    parts.push(`str($(${quote(match[1])}, ''))`)
    rest = rest.substring(match.index + match[0].length)
  }
  return parts.length ? parts.join(' + ') : "''"
}

const ACCOUNT_PATTERN = /^(ACCOUNT|EXPENSE|INCOME|TAX)_[A-Z0-9_]+$/

/**
 * Compile the action of a mapping rule to a result expression.
 */
export function compileResult(view: MappingResultView): UnifiedItemRule {
  if (view.action === 'skip') {
    return { type: "'skip'" }
  }

  const result: UnifiedItemRule = {
    value: 'abs(total)',
    text: compileTemplate(view.text || '{Saaja/Maksaja} {Viesti}'),
  }

  switch (view.action) {
    case 'expense':
    case 'income':
    case 'tax': {
      const account = view.account || ''
      if (!ACCOUNT_PATTERN.test(account)) {
        throw new MappingError(`Invalid account ${JSON.stringify(account)} for action '${view.action}'.`)
      }
      if (view.action === 'tax' && !account.startsWith('TAX_')) {
        throw new MappingError(`Tax action needs a tax account, got ${JSON.stringify(account)}.`)
      }
      // The sign decides the direction, so that for example refunds of expenses are handled by the same rule.
      result.type = "total < 0 ? 'expense' : 'income'"
      result.account = quote(account)
      break
    }
    case 'transfer':
      if (!view.service) {
        throw new MappingError('Transfer action needs the name of the service.')
      }
      result.type = "total < 0 ? 'withdrawal' : 'deposit'"
      result.service = quote(view.service)
      break
    case 'internalTransfer':
      result.type = "total < 0 ? 'expense' : 'income'"
      result.account = quote('TRANSFER_INTERNAL')
      break
    default:
      throw new MappingError(`Unknown action ${JSON.stringify(view.action)}.`)
  }

  if (view.tags && view.tags.length) {
    result.tags = `[${view.tags.map(quote).join(', ')}]`
  }

  if (view.vat && view.vat.mode === 'rate') {
    if (view.action !== 'expense' && view.action !== 'income') {
      throw new MappingError('VAT can be used only with expenses and income.')
    }
    if (typeof view.vat.rate !== 'number' || view.vat.rate <= 0 || view.vat.rate >= 100) {
      throw new MappingError(`Invalid VAT rate ${JSON.stringify(view.vat.rate)}.`)
    }
    result.taxType = "'vat'"
    result.taxPercentage = `${view.vat.rate}`
  }

  return result
}
