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
}

/**
 * Quote a string as an expression literal.
 */
export function quote(s: string): string {
  return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`
}

/**
 * Expression for the value of a field as lower case string.
 */
function text(field: string): string {
  return `lower(str($(${quote(field)}, '')))`
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

/**
 * Compile one condition.
 */
function compileCondition(condition: MappingCondition): string {
  const { field, operator, value } = condition
  switch (operator) {
    case 'equals':
      return `${text(field)} == ${quote(string(condition, value).toLowerCase())}`
    case 'contains':
      return `contains(${text(field)}, ${quote(string(condition, value).toLowerCase())})`
    case 'oneOf':
      if (!(value instanceof Array) || value.length === 0) {
        throw new MappingError(`Condition 'oneOf' for field '${field}' needs a list of values.`)
      }
      return `(${value.map(v => `${text(field)} == ${quote(string(condition, v).toLowerCase())}`).join(' or ')})`
    case 'regex': {
      const re = string(condition, value)
      try {
        // eslint-disable-next-line no-new
        new RegExp(re)
      } catch (err) {
        throw new MappingError(`Invalid regular expression ${JSON.stringify(re)} for field '${field}'.`)
      }
      return `matches(${quote(re)}, $(${quote(field)}, ''))`
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
 * Compile the conditions of a mapping rule to a filter expression.
 */
export function compileFilter(view: MappingFilterView): string {
  if (!view.conditions.length) {
    return 'true'
  }
  return view.conditions.map(compileCondition).join(' and ')
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
