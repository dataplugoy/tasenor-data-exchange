/**
 * Convert Tasenor Bookkeeper TITO import configuration to TaDeX rules and one-off answers.
 *
 * Bookkeeper rules are pairs of transfers: the bank side (`type: 'currency'`) and the counter side (statement,
 * external or account). The counter side is mapped to a direct account number (`ACCOUNT_<number>`) using the
 * importer settings, so that TaDeX books to the same accounts.
 *
 * - Rules with simple filters become mapping rules, others advanced rules with the original filter expression.
 * - Rules asking questions per transaction cannot be converted. Their past answers become one-off answers.
 * - Explicit transactions and skips given as answers become one-off answers.
 */
import { RuleVariables, RulesEngine } from '@tasenor/common'
import { RULE_HELPERS } from '../../backend/src/lib/mapping'
import { InputItemData } from '../../backend/src/types/API/InputItemData'
import { UnifiedItemData } from '../../backend/src/types/API/UnifiedItemData'
import { MappingCondition } from '../../backend/src/types/API/MappingCondition'
import { SaveRuleRequest } from '../../backend/src/types/API/flow-plans/SaveRuleRequest'

type Expression = string
type Transfer = {
  reason: Expression
  type: Expression
  asset: Expression
  amount?: Expression
  text?: Expression
  tags?: Expression | Expression[]
  data?: Record<string, Expression>
}
export type BookkeeperRule = {
  name: string
  filter: Expression
  result: Transfer[]
  questions?: Record<string, { name: string }>
  options?: Record<string, unknown>
}
type Question = { name: string, label?: string, ask?: Record<string, string>, chooseTag?: string[], text?: boolean }
type AnswerTransfer = { reason: string, type: string, asset: string, amount: number, text?: string, data?: { text?: string, vat?: number } }
type Answer = Record<string, unknown> & {
  transfers?: AnswerTransfer[]
  skip?: boolean
}

export type VatPeriod = { from: string, to: string | null, percentage: Record<string, number> }

/**
 * Knowledge of the bookkeeper used for default VAT: rates per category and period, and parents of the categories.
 */
export type Knowledge = {
  vat: VatPeriod[]
  parents: Record<string, string | null>
}

export type ConversionInput = {
  rules: BookkeeperRule[]
  questions: Question[]
  answers: Record<string, Answer>
  settings: Record<string, unknown>
  items: InputItemData[]
  knowledge?: Knowledge
}

export type ConversionOutput = {
  rules: SaveRuleRequest[]
  answers: Record<string, UnifiedItemData>
  report: string[]
}

/**
 * Parse a literal string expression like `'NREQ'`.
 */
function literal(expr: unknown): string | null {
  if (typeof expr !== 'string') return null
  const m = /^\s*'((?:[^'\\]|\\.)*)'\s*$/.exec(expr)
  return m ? m[1].replace(/\\(.)/g, '$1') : null
}

/**
 * Parse tags given as `[TR][Nordea]` string.
 */
function bracketTags(s: string): string[] {
  return [...s.matchAll(/\[([^\][]+)\]/g)].map(m => m[1])
}

/**
 * Convert literal tag expressions to a list or null if they depend on variables.
 */
function literalTags(tags: Transfer['tags']): string[] | null {
  if (tags === undefined) return []
  if (tags instanceof Array) {
    const list = tags.map(literal)
    return list.every(t => t !== null) ? list as string[] : null
  }
  const s = tags.trim()
  if (/^\[\s*"/.test(s)) {
    return JSON.parse(s)
  }
  if (/^\[\s*'/.test(s)) {
    return [...s.matchAll(/'((?:[^'\\]|\\.)*)'/g)].map(m => m[1])
  }
  const lit = literal(s)
  return lit !== null ? bracketTags(lit) : null
}

/**
 * Get the counter side of a rule result.
 */
function counterTransfer(result: Transfer[]): Transfer | null {
  const counters = result.filter(t => literal(t.type) !== 'currency')
  return counters.length === 1 ? counters[0] : null
}

/**
 * Find the account number for a transfer.
 */
function accountFor(settings: Record<string, unknown>, reason: string, type: string, asset: string, overrides: Record<string, unknown> = {}): string | null {
  const key = `account.${reason}.${type}.${asset}`
  const value = key in overrides ? overrides[key] : settings[key]
  return typeof value === 'string' && /^\d+$/.test(value) ? value : null
}

const FIELD_REF = /^(?:\$\('([^']+)'(?:,\s*'')?\)|([A-Za-zÄÖÅäöå]+))$/

/**
 * Convert one term of a filter to a mapping condition.
 */
function termToCondition(term: string): MappingCondition | null {
  let m
  const t = term.trim()
  if ((m = /^\$\('Tapahtuman rahamäärä'\)\s*([<>])\s*0$/.exec(t))) {
    return { field: '', operator: m[1] === '<' ? 'negative' : 'positive' }
  }
  if ((m = /^(.+?)\s*==\s*'((?:[^'\\]|\\.)+)'$/.exec(t))) {
    const f = FIELD_REF.exec(m[1].trim())
    if (f) return { field: f[1] || f[2], operator: 'equals', value: m[2] }
  }
  if ((m = /^has\(\[(.*)\],\s*(.+)\)$/.exec(t))) {
    const f = FIELD_REF.exec(m[2].trim())
    const values = [...m[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)].map(v => v[1])
    if (f && values.length) return { field: f[1] || f[2], operator: 'oneOf', value: values }
  }
  if ((m = /^regex\('((?:[^'\\]|\\.)+)',\s*(.+)\)$/.exec(t))) {
    const f = FIELD_REF.exec(m[2].trim())
    if (f) return { field: f[1] || f[2], operator: 'regex', value: m[1] }
  }
  // Alternatives for the same field.
  if ((m = /^\((.*)\)$/.exec(t)) && !/\band\b/.test(m[1])) {
    const parts = m[1].split(/\s+or\s+/).map(termToCondition)
    if (parts.every(p => p && p.operator === 'equals') && new Set(parts.map(p => p?.field)).size === 1) {
      return { field: (parts[0] as MappingCondition).field, operator: 'oneOf', value: parts.map(p => (p as MappingCondition).value as string) }
    }
  }
  return null
}

/**
 * Convert a filter to mapping conditions if it consists of simple terms joined with `and`.
 */
export function filterToConditions(filter: string): MappingCondition[] | null {
  const terms: string[] = []
  let depth = 0
  let current = ''
  const words = filter.split(/(\s+and\s+|[()])/)
  for (const w of words) {
    if (w === '(') depth++
    if (w === ')') depth--
    if (depth === 0 && /^\s+and\s+$/.test(w)) {
      terms.push(current)
      current = ''
    } else {
      current += w
    }
  }
  terms.push(current)
  const conditions = terms.map(termToCondition)
  return conditions.every(c => c !== null) ? conditions as MappingCondition[] : null
}

/**
 * Convert a bookkeeper TITO import configuration.
 */
export function convert(input: ConversionInput): ConversionOutput {
  const { settings, questions } = input
  const report: string[] = []
  const rules: SaveRuleRequest[] = []
  const questionRules = new Set<BookkeeperRule>()
  const usable = input.rules.filter(rule => {
    if (/Tietuetunnus\s*!=\s*'10'/.test(rule.filter)) {
      // TaDeX combines the additional records to the transaction.
      return false
    }
    return true
  })

  for (const rule of usable) {
    const counter = counterTransfer(rule.result)
    const reason = counter && literal(counter.reason)
    const type = counter && literal(counter.type)
    const asset = counter && literal(counter.asset)
    const bank = rule.result.find(t => literal(t.type) === 'currency')
    const tags = counter ? literalTags(counter.tags) : null
    if (rule.questions || !counter || !reason || !type || !asset || tags === null) {
      questionRules.add(rule)
      report.push(`Rule '${rule.name}' needs answers per transaction and is converted to one-off answers.`)
      continue
    }
    const account = accountFor(settings, reason, type, asset)
    if (!account) {
      report.push(`Rule '${rule.name}': no account for ${reason}.${type}.${asset}, not converted.`)
      continue
    }
    const textExpr = (bank && bank.text) || counter.text || null
    const textLiteral = textExpr ? literal(textExpr) : null
    const conditions = filterToConditions(rule.filter)

    // Default VAT of the category on the dates of the lines this rule would take.
    const dates = input.items.filter(item => firstMatching(usable, item) === rule).map(item => item.time)
    const rates = new Set(dates.map(date => defaultVat(input.knowledge, reason, asset, date)))
    if (!dates.length) {
      rates.add(defaultVat(input.knowledge, reason, asset, '9999-12-31'))
    }
    const vatRate = rates.size === 1 ? [...rates][0] : null
    if (vatRate === null) {
      report.push(`Rule '${rule.name}' covers different VAT rates and is converted to an advanced rule.`)
    } else if (vatRate) {
      report.push(`Rule '${rule.name}' has VAT ${vatRate}% as the default of ${asset}. Update the rule when the rate changes.`)
    }

    if (conditions && vatRate !== null && (textExpr === null || textLiteral !== null)) {
      rules.push({
        name: rule.name,
        kind: 'MAPPING',
        filterView: { conditions },
        resultView: {
          action: reason === 'income' ? 'income' : 'expense',
          account: `ACCOUNT_${account}`,
          text: textLiteral !== null ? textLiteral : '{Seliteteksti}',
          tags,
          vat: vatRate ? { mode: 'rate', rate: vatRate } : { mode: 'none' },
        },
      })
    } else {
      rules.push({
        name: rule.name,
        kind: 'ADVANCED',
        filter: rule.filter,
        key: '',
        result: {
          type: "total < 0 ? 'expense' : 'income'",
          value: 'abs(total)',
          account: `'ACCOUNT_${account}'`,
          text: textExpr || 'text',
          tags: `[${tags.map(t => `'${t.replace(/'/g, "\\'")}'`).join(', ')}]`,
          ...(vatRate === null && input.knowledge ? { taxType: "'vat'", taxPercentage: vatExpression(input.knowledge, reason, asset) } : {}),
          ...(vatRate ? { taxType: "'vat'", taxPercentage: `${vatRate}` } : {}),
        },
      })
    }
  }

  // One-off answers.
  const answers: Record<string, UnifiedItemData> = {}
  const byKey: Record<string, InputItemData> = {}
  input.items.forEach(item => { byKey[item.fields.Arkistointitunnus as string] = item })

  let otherStatements = 0
  for (const [key, answer] of Object.entries(input.answers)) {
    const item = byKey[key]
    if (!item) {
      // Answers may cover other statements than the ones converted.
      otherStatements++
      continue
    }
    const total = item.total as number
    if (answer.skip) {
      answers[key] = { type: 'skip' }
      continue
    }
    if (answer.transfers) {
      const data = convertTransfers(settings, answer.transfers, total, input.knowledge, item.time)
      if (!data) {
        report.push(`Answer for ${key} has transfers that cannot be converted.`)
        continue
      }
      answers[key] = data
      continue
    }

    // Answers to questions of a rule: evaluate the rule matching the transaction.
    const variables = { ...RULE_HELPERS, ...item.fields, text: item.text, total, config: { currency: settings.currency }, lines: [item.fields], ...answer }
    const engine = new RulesEngine({
      ...variables,
      chosen: (variable: string) => chosenLabel(questions, input.rules, variable, answer[variable]),
    } as unknown as RuleVariables)
    const rule = usable.find(r => {
      try {
        return !!engine.eval(r.filter)
      } catch (err) {
        return false
      }
    })
    if (!rule || !questionRules.has(rule)) {
      report.push(`Answer for ${key} does not belong to a rule asking questions (${rule ? rule.name : 'no rule'}).`)
      continue
    }
    const counter = counterTransfer(rule.result) as Transfer
    const bank = rule.result.find(t => literal(t.type) === 'currency')
    const reason = `${engine.eval(counter.reason)}`
    const type = `${engine.eval(counter.type)}`
    const asset = `${engine.eval(counter.asset)}`
    const account = accountFor(settings, reason, type, asset, answer)
    if (!account) {
      report.push(`Answer for ${key}: no account for ${reason}.${type}.${asset}.`)
      continue
    }
    const text = `${engine.eval((bank && bank.text) || counter.text || 'text')}`
    let tags: string[] = []
    if (counter.tags instanceof Array) {
      tags = counter.tags.map(t => `${engine.eval(t)}`).filter(t => t !== '')
    } else if (counter.tags) {
      const value = engine.eval(counter.tags)
      tags = value instanceof Array ? value.map(v => `${v}`) : bracketTags(`${value}`)
    }
    const data: UnifiedItemData = {
      type: total < 0 ? 'expense' : 'income',
      value: Math.abs(total),
      account: `ACCOUNT_${account}`,
      text,
      tags,
    }
    if (counter.data?.vatValue !== undefined) {
      const vat = Number(engine.eval(counter.data.vatValue))
      if (vat) {
        data.taxType = 'vat'
        data.taxAmount = vat
      }
    } else {
      const rate = type === 'statement' ? defaultVat(input.knowledge, reason, asset, item.time) : 0
      if (rate) {
        data.taxType = 'vat'
        data.taxPercentage = rate
      }
    }
    answers[key] = data
  }

  // Rule names must be unique in TaDeX.
  const seen: Record<string, number> = {}
  for (const rule of rules) {
    seen[rule.name] = (seen[rule.name] || 0) + 1
    if (seen[rule.name] > 1) {
      report.push(`Rule name '${rule.name}' is used more than once, renamed to '${rule.name} (${seen[rule.name]})'.`)
      rule.name = `${rule.name} (${seen[rule.name]})`
    }
  }

  if (otherStatements) {
    report.push(`${otherStatements} answers are for transactions not in these statements.`)
  }

  return { rules, answers, report }
}

/**
 * Find the label of the chosen answer for `chosen()` function.
 */
function chosenLabel(questions: Question[], rules: BookkeeperRule[], variable: string, value: unknown): string {
  for (const rule of rules) {
    const ref = rule.questions && rule.questions[variable]
    if (!ref) continue
    const question = questions.find(q => q.name === ref.name)
    if (question && question.ask) {
      const label = Object.keys(question.ask).find(k => question.ask && question.ask[k] === value)
      if (label !== undefined) return label
    }
  }
  return `${value ?? ''}`
}

/**
 * Convert an explicit list of transfers given as an answer.
 * The bank side is skipped, VAT transfers become the tax of the item and exactly one other transfer must remain.
 */
function convertTransfers(settings: Record<string, unknown>, transfers: AnswerTransfer[], total: number, knowledge: Knowledge | undefined, date: string): UnifiedItemData | null {
  const cash = `${settings.cashAccount}`
  const vatAccounts = new Set(Object.keys(settings).filter(k => /^account\.tax\.statement\.VAT_/.test(k)).map(k => `${settings[k]}`))
  const isCash = (t: AnswerTransfer) => t.type === 'currency' || (t.type === 'account' && t.asset === cash)
  const isVat = (t: AnswerTransfer) => (t.type === 'account' && vatAccounts.has(t.asset)) || (t.type === 'statement' && t.reason === 'tax' && /^VAT_/.test(t.asset))
  const main = transfers.filter(t => !isCash(t) && !isVat(t))
  if (main.length !== 1) {
    return null
  }
  const [counter] = main
  const account = counter.type === 'account' ? counter.asset : accountFor(settings, counter.reason, counter.type, counter.asset)
  if (!account) {
    return null
  }
  const text = counter.data?.text || counter.text || transfers.map(t => t.data?.text || t.text).find(t => t) || ''
  const data: UnifiedItemData = {
    type: total < 0 ? 'expense' : 'income',
    value: Math.abs(total),
    account: `ACCOUNT_${account}`,
    text: text.replace(/^(\[[^\]]+\])+\s*/, ''),
    tags: bracketTags(text.replace(/^((\[[^\]]+\])+).*$/s, '$1')),
  }
  const vatAmount = transfers.filter(isVat).reduce((sum, t) => sum + Math.abs(t.amount), 0)
  if (vatAmount) {
    data.taxType = 'vat'
    data.taxAmount = Math.round(vatAmount * 100) / 100
  } else if (counter.data && counter.data.vat !== undefined) {
    if (counter.data.vat) {
      data.taxType = 'vat'
      data.taxPercentage = counter.data.vat
    }
  } else if (counter.type === 'statement') {
    const rate = defaultVat(knowledge, counter.reason, counter.asset, date)
    if (rate) {
      data.taxType = 'vat'
      data.taxPercentage = rate
    }
  }
  return data
}

/**
 * Default VAT percentage of a category on a date, looked up through the parents of the category.
 */
export function defaultVat(knowledge: Knowledge | undefined, reason: string, code: string, date: string): number {
  if (!knowledge || (reason !== 'expense' && reason !== 'income')) {
    return 0
  }
  const period = knowledge.vat.find(p => p.from <= date && (p.to === null || date <= p.to))
  if (!period) {
    return 0
  }
  let current: string | null = code
  while (current) {
    if (current in period.percentage) {
      return period.percentage[current]
    }
    current = knowledge.parents[current] ?? null
  }
  return 0
}

/**
 * Expression for the default VAT of a category over all periods.
 */
function vatExpression(knowledge: Knowledge, reason: string, code: string): string {
  const periods = [...knowledge.vat].sort((a, b) => a.from.localeCompare(b.from))
  let expr = `${defaultVat(knowledge, reason, code, periods[periods.length - 1].from)}`
  for (let i = periods.length - 2; i >= 0; i--) {
    expr = `time < '${periods[i + 1].from}' ? ${defaultVat(knowledge, reason, code, periods[i].from)} : (${expr})`
  }
  return expr
}

/**
 * Find the first bookkeeper rule matching an item.
 */
function firstMatching(rules: BookkeeperRule[], item: InputItemData): BookkeeperRule | undefined {
  const engine = new RulesEngine({ ...RULE_HELPERS, ...item.fields, text: item.text, total: item.total, lines: [item.fields] } as unknown as RuleVariables)
  return rules.find(rule => {
    try {
      return !!engine.eval(rule.filter)
    } catch (err) {
      return false
    }
  })
}
