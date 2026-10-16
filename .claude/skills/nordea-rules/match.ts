/**
 * Match lines of a Nordea TITO statement against the rules of the Tasenor Bookkeeper TITO importer and the
 * rules of a TaDeX flow plan.
 *
 * Usage (from the repository root):
 *   backend/node_modules/.bin/tsx .claude/skills/nordea-rules/match.ts <file.nda> [options]
 *
 * Options:
 *   --config <path>      Bookkeeper importer config.json (default: the Nordea TITO importer in tasenor-backup).
 *   --flow <title>       Title of the TaDeX flow plan whose rules are used (default: Nordea).
 *   --db <url>           TaDeX database URL used inside the tadex-db container (default: local dev database).
 *   --candidates <path>  JSON list of SaveRuleRequest objects to test as if they were added after the existing rules.
 *   --json               Print the result as JSON.
 */
import fs from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { parseTitoRecords, titoItems, isTito } from '../../../backend/src/lib/tito'
import { RULE_HELPERS, compileFilter, compileResult } from '../../../backend/src/lib/mapping'
import { ajv } from '../../../backend/src/lib/validate'
import SaveRuleRequest from '../../../backend/src/types/API/flow-plans/SaveRuleRequest.json'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const require = createRequire(path.join(ROOT, 'backend', 'package.json'))
const { RulesEngine } = require('@tasenor/common')

const DEFAULT_CONFIG = '/home/wigy/projects/tasenor-backup/bookkeeper/staging/dataplug/export/importers/Nordea TITO/config.json'
const DEFAULT_DB = 'postgres://dev:02u3QD2e3wxssfdr3sxds@localhost:7300/tadex'
const PROJECT_SETTINGS = { currency: 'EUR', language: 'fi' }

type Rule = { name: string, filter: string, result?: unknown, origin: string, ask?: number[] }
type Question = { id: number, name: string, label: string, kind: string, options: { label: string, tags?: string[], account?: string }[] }

function option(name: string, def: string | null = null): string | null {
  const i = process.argv.indexOf(`--${name}`)
  return i > 0 ? process.argv[i + 1] : def
}

/**
 * Read enabled rules of the flow plan in the order they are applied.
 */
function tadexRules(flow: string, db: string): Rule[] {
  const sql = `select coalesce(json_agg(r), '[]') from (select name, filter, result, "resultView"->'ask' as ask from rules
    where enabled and "flowPlanId" = (select id from flow_plans where title = '${flow.replace(/'/g, "''")}' limit 1)
    order by priority desc, id) r`
  const out = execFileSync('docker', ['exec', 'tadex-db', 'psql', db, '-At', '-c', sql]).toString()
  return (JSON.parse(out) as Rule[]).map(r => ({ ...r, origin: 'tadex' }))
}

/**
 * Read the rule questions of the project of the flow plan by ID.
 */
function tadexQuestions(flow: string, db: string): Record<number, Question> {
  const sql = `select coalesce(json_agg(q), '[]') from (select id, name, label, kind, options from rule_questions
    where "projectId" = (select "projectId" from flow_plans where title = '${flow.replace(/'/g, "''")}' limit 1)) q`
  const out = execFileSync('docker', ['exec', 'tadex-db', 'psql', db, '-At', '-c', sql]).toString()
  return (JSON.parse(out) as Question[]).reduce((prev, cur) => ({ ...prev, [cur.id]: cur }), {})
}

/**
 * Find the first rule matching. Errors in filters count as no match but are reported.
 */
function firstMatch(engine, rules: Rule[], errors: Set<string>): Rule | null {
  for (const rule of rules) {
    try {
      if (engine.eval(rule.filter)) {
        return rule
      }
    } catch (err) {
      errors.add(`${rule.origin} rule '${rule.name}': ${err.message}`)
    }
  }
  return null
}

function main() {
  const file = process.argv[2]
  if (!file || file.startsWith('--')) {
    console.log('usage: match.ts <file.nda> [--config path] [--flow title] [--db url] [--candidates path] [--json]')
    process.exit(1)
  }
  const text = fs.readFileSync(file).toString('latin1')
  if (!isTito(text)) {
    throw new Error(`${file} is not a TITO statement.`)
  }
  const items = titoItems(parseTitoRecords(text))

  const config = JSON.parse(fs.readFileSync(option('config', DEFAULT_CONFIG) as string).toString('utf-8'))
  const bookkeeperRules: Rule[] = config.rules.map(r => ({ name: r.name, filter: r.filter, result: r.result, origin: 'bookkeeper' }))
  const rules = tadexRules(option('flow', 'Nordea') as string, option('db', DEFAULT_DB) as string)
  const questions = tadexQuestions(option('flow', 'Nordea') as string, option('db', DEFAULT_DB) as string)
  const candidatesPath = option('candidates')
  if (candidatesPath) {
    for (const c of JSON.parse(fs.readFileSync(candidatesPath).toString('utf-8'))) {
      // The same validation as the API does for saving a rule.
      if (!ajv.validate(SaveRuleRequest, c)) {
        throw new Error(`Candidate '${c.name}' is not a valid SaveRuleRequest: ${ajv.errorsText(ajv.errors)}`)
      }
      const filter = c.kind === 'MAPPING' ? compileFilter(c.filterView) : c.filter
      const result = c.kind === 'MAPPING' ? compileResult(c.resultView) : c.result
      const ask: number[] = c.kind === 'MAPPING' ? c.resultView.ask || [] : []
      // The same check as the API does for the questions asked.
      for (const id of ask) {
        if (!questions[id]) {
          throw new Error(`Candidate '${c.name}' asks question #${id}, which does not exist in the project.`)
        }
      }
      rules.push({ name: `${c.name} (candidate)`, filter, result, origin: 'candidate', ask })
    }
  }

  const errors = new Set<string>()
  const lines = items.map(item => {
    const fields = item.fields as Record<string, unknown>
    // The same variables as InputDriver.ruleVariables().
    const tadexVars = { text: item.text, line: item.line, time: item.time, total: item.total, original: item.original, version: item.version, ...PROJECT_SETTINGS, ...fields }
    // Bookkeeper TITO importer had all record types as segments and the transaction record as `Tietuetunnus` 10.
    const bookkeeperVars = { ...fields, Tietuetunnus: '10', text: item.text, config, lines: [] }
    const bk = firstMatch(new RulesEngine(bookkeeperVars, true), bookkeeperRules, errors)
    const tx = firstMatch(new RulesEngine({ ...RULE_HELPERS, ...tadexVars }, true), rules, errors)
    let result: unknown = null
    if (tx) {
      try {
        result = new RulesEngine({ ...RULE_HELPERS, ...tadexVars }, true).eval(tx.result)
      } catch (err) {
        errors.add(`${tx.origin} rule '${tx.name}' result: ${err.message}`)
      }
    }
    return {
      line: item.line,
      date: item.time,
      total: item.total,
      counterparty: fields['Saaja/Maksaja'] || '',
      type: fields.Seliteteksti || '',
      reference: fields.Viite || fields['Toimeksiantajan tieto-1'] || '',
      message: `${fields.Viesti || fields['Lisätieto'] || ''}`.replace(/\n/g, ' / '),
      bookkeeperRule: bk ? bk.name : null,
      tadexRule: tx ? tx.name : null,
      tadexResult: result,
      // Questions asked for the line, answered in the TaDeX UI when importing.
      tadexAsks: tx ? (tx.ask || []).map(id => questions[id] ? `${questions[id].label} (${questions[id].kind})` : `#${id}`) : [],
    }
  })

  if (option('json') !== null || process.argv.includes('--json')) {
    console.log(JSON.stringify({ lines, errors: [...errors] }, null, 2))
    return
  }

  const pad = (s: unknown, n: number) => `${s ?? ''}`.substring(0, n).padEnd(n)
  console.log(`${pad('Line', 5)} ${pad('Date', 10)} ${pad('Amount', 10)} ${pad('Counterparty', 28)} ${pad('Ref', 8)} ${pad('Bookkeeper rule', 34)} TaDeX rule`)
  for (const l of lines) {
    console.log(`${pad(l.line, 5)} ${pad(l.date, 10)} ${`${l.total}`.padStart(10)} ${pad(l.counterparty, 28)} ${pad(l.reference, 8)} ${pad(l.bookkeeperRule || '-- NONE --', 34)} ${l.tadexRule || '-- NONE --'}${l.tadexAsks.length ? ` [asks: ${l.tadexAsks.join(', ')}]` : ''}`)
  }
  const missing = lines.filter(l => !l.tadexRule)
  console.log()
  console.log(`${lines.length} lines, ${lines.filter(l => l.bookkeeperRule).length} matched by bookkeeper rules, ${lines.length - missing.length} by TaDeX rules.`)
  const needed = new Map<string, number>()
  missing.forEach(l => needed.set(l.bookkeeperRule || '-- NONE --', (needed.get(l.bookkeeperRule || '-- NONE --') || 0) + 1))
  if (needed.size) {
    console.log('Bookkeeper rules to convert (lines without TaDeX rule):')
    for (const [name, count] of needed) {
      console.log(`  ${count} x ${name}`)
    }
  }
  for (const err of errors) {
    console.log(`ERROR ${err}`)
  }
}

main()
