/**
 * Compare TaDeX results against the expected results of a Tasenor Bookkeeper TITO import test.
 *
 * Usage: npx tsx testing/parity/compare-tito.ts <path to bookkeeper import test directory>
 *
 * The bookkeeper rules, questions, answers and settings are converted to TaDeX rules and one-off answers, the
 * statements are run through the 'TITO Testing' flow plan and the transactions are compared per archive id and
 * account number against the bookkeeper `transactions.json`.
 *
 * NOTE: This resets the development database.
 */
import { execFileSync, spawnSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import prisma from '@prisma/client'
import { parseTitoRecords, titoItems } from '../../backend/src/lib/tito'
import { BaseModel } from '../../backend/src/models/BaseModel'
import { connect } from '../../backend/src/connect'
import { RuleModel } from '../../backend/src/models/RuleModel'
import { FlowPlanModel } from '../../backend/src/models/FlowPlanModel'
import { BookkeeperRule, Knowledge, convert } from './tito-converter'

const ROOT = path.resolve(__dirname, '..', '..')
const FLOW = 'TITO Testing'
const DB = 'postgresql://dev:02u3QD2e3wxssfdr3sxds@localhost:7300/tadex'
const TOLERANCE = 1

type Cents = number
type Segment = { date: string, text: string, amounts: Record<string, Cents> }

function readJson<T>(dir: string, file: string, def: T | null = null): T {
  const p = path.join(dir, file)
  if (!fs.existsSync(p)) {
    if (def !== null) return def
    throw new Error(`Missing ${p}.`)
  }
  return JSON.parse(fs.readFileSync(p).toString('utf-8'))
}

function tadex(...args: string[]): string {
  const res = spawnSync(path.join(ROOT, 'bin', 'tadex.mjs'), args, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] })
  const out = `${res.stdout}${res.stderr}`
  if (res.status !== 0) {
    throw new Error(`Command 'tadex ${args.join(' ')}' failed:\n${out.split('\n').filter(l => !/^\s+at /.test(l)).slice(-20).join('\n')}`)
  }
  return out
}

/**
 * Read VAT knowledge from the bookkeeper plugins (next to tasenor-qa import tests).
 */
function readKnowledge(): Knowledge {
  const plugins = process.env.BOOKKEEPER_PLUGINS || path.join(ROOT, '..', 'tasenor-qa', 'tasenor-bookkeeper', 'packages', 'tasenor-common-plugins', 'src')
  const parents = {
    ...readJson<{ parents: Record<string, string | null> }>(path.join(plugins, 'IncomeAndExpenses', 'backend'), 'expense.json').parents,
    ...readJson<{ parents: Record<string, string | null> }>(path.join(plugins, 'IncomeAndExpenses', 'backend'), 'income.json').parents,
  }
  const vat = readJson<Knowledge['vat']>(path.join(plugins, 'VATFinland', 'backend'), 'vat.json')
  return { vat, parents }
}

function euros(cents: Cents): string {
  return (cents / 100).toFixed(2).padStart(12)
}

async function main(testDir: string): Promise<number> {
  testDir = path.resolve(testDir)
  const testName = path.basename(testDir)
  const settings = readJson<Record<string, unknown>>(testDir, 'settings.json')
  const rulesJson = readJson<BookkeeperRule[] | { rules: BookkeeperRule[] }>(testDir, 'rules.json')
  const questions = readJson<{ questions: [] }>(testDir, 'questions.json', { questions: [] }).questions
  const answers = readJson<Record<string, Record<string, unknown>>>(testDir, 'answers.json', {})
  const expected = readJson<{ date: string, segmentId: string, entries: { account: string, amount: Cents, description: string }[] }[]>(testDir, 'transactions.json')

  // Statement files: combined file if available.
  const files = fs.readdirSync(testDir).filter(f => /\.nda$/i.test(f)).sort()
  const statementFiles = files.includes('TITO-all.nda') ? ['TITO-all.nda'] : files.filter(f => f !== 'TITO-all.nda')
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'tadex-tito-parity-'))
  const statement = path.join(work, 'statement.nda')
  fs.writeFileSync(statement, Buffer.concat(statementFiles.map(f => fs.readFileSync(path.join(testDir, f)))))
  const items = titoItems(parseTitoRecords(fs.readFileSync(statement).toString('latin1')))

  const conversion = convert({
    rules: rulesJson instanceof Array ? rulesJson : rulesJson.rules,
    questions,
    answers,
    settings,
    items,
    knowledge: readKnowledge(),
  })
  console.log(`Running ${testName}: ${items.length} transactions, ${conversion.rules.length} rules (${conversion.rules.filter(r => r.kind === 'MAPPING').length} mapping), ${Object.keys(conversion.answers).length} one-off answers.`)
  conversion.report.forEach(line => console.log(`  NOTE ${line}`))

  // Load converted configuration.
  execFileSync('pnpm', ['load'], { cwd: path.join(ROOT, 'database'), stdio: 'ignore' })
  process.env.DATABASE_URL = DB
  BaseModel.setDb(await connect())
  const flow = (await FlowPlanModel.findMany<prisma.FlowPlan, FlowPlanModel>({ title: FLOW } as Partial<prisma.FlowPlan>))[0]
  let priority = conversion.rules.length
  for (const rule of conversion.rules) {
    await RuleModel.save({ ...RuleModel.fromRequest(rule), flowPlanId: flow.id, priority: priority-- })
  }
  await flow.updateSetup({ answers: conversion.answers })

  // Run.
  tadex('run', FLOW)
  tadex('upload', FLOW, statement)
  const log = tadex('run', FLOW, 'all')
  fs.writeFileSync(path.join(work, 'run.log'), log)
  const problems = log.split('\n').filter(l => /ANSWERS_REQUIRED|Run not successful|Error:/.test(l))
  if (problems.length) {
    problems.forEach(p => console.log(p.substring(0, 2000)))
    console.log(`FAILED: TaDeX run did not complete for ${testName} (log in ${work}).`)
    return 1
  }

  // Collect results.
  const dump = execFileSync('docker', ['exec', 'tadex-db', 'psql', '-At', DB, '-c',
    `select coalesce(json_agg(json_build_object('key', i.data->'fields'->>'Arkistointitunnus', 'time', o.data->'time', 'lines', o.data->'lines')), '[]')
     from output_items o join unified_items u on u.id = o."unifiedId" join input_items i on i.id = u."inputId"
     where o."flowPlanId" = ${flow.id}`
  ]).toString('utf-8')
  const outputs: { key: string, time: string, lines: { account: string, amount: string, text: string }[] }[] = JSON.parse(dump)

  const account = (code: string): string => {
    if (/^\d+$/.test(code)) return code
    if (/^BANK_/.test(code)) return `${settings.cashAccount}`
    const tax = /^TAX_(.*)$/.exec(code)
    if (tax && settings[`account.tax.statement.${tax[1]}`]) return `${settings[`account.tax.statement.${tax[1]}`]}`
    return code
  }

  const bk: Record<string, Segment> = {}
  for (const tx of expected) {
    const seg = bk[tx.segmentId] = bk[tx.segmentId] || { date: tx.date.substring(0, 10), text: tx.entries[0]?.description || '', amounts: {} }
    tx.entries.forEach(e => { seg.amounts[e.account] = (seg.amounts[e.account] || 0) + e.amount })
  }
  const td: Record<string, Segment> = {}
  for (const out of outputs) {
    const seg = td[out.key] = td[out.key] || { date: out.time.substring(0, 10), text: out.lines[0]?.text || '', amounts: {} }
    out.lines.forEach(l => {
      const a = account(l.account)
      seg.amounts[a] = (seg.amounts[a] || 0) + Math.round(parseFloat(l.amount) * 100)
    })
  }

  const known = readJson<Record<string, Record<string, string>>>(__dirname, 'known-differences.json', {})[testName] || {}
  const knownSeen = new Set<string>()
  let matched = 0
  let failed = 0
  for (const key of [...new Set([...Object.keys(bk), ...Object.keys(td)])].sort()) {
    const b = bk[key]?.amounts || {}
    const t = td[key]?.amounts || {}
    const diffs = [...new Set([...Object.keys(b), ...Object.keys(t)])]
      .map(a => [a, b[a] || 0, t[a] || 0] as [string, Cents, Cents])
      .filter(([, x, y]) => Math.abs(x - y) > TOLERANCE)
    if (!diffs.length) {
      matched++
      continue
    }
    const reason = known[key]
    if (reason) knownSeen.add(key)
    else failed++
    console.log(`${reason ? 'KNOWN' : 'DIFF '} #${key} ${(bk[key] || td[key]).date}  BK: ${bk[key]?.text || '-'}  |  TaDeX: ${td[key]?.text || '-'}`)
    if (reason) console.log(`      ${reason}`)
    diffs.forEach(([a, x, y]) => console.log(`      ${a.padEnd(12)} BK ${euros(x)}  TaDeX ${euros(y)}`))
  }
  for (const key of Object.keys(known)) {
    if (!knownSeen.has(key)) {
      console.log(`STALE known difference #${key} no longer differs: ${known[key]}`)
      failed++
    }
  }

  console.log(`${testName}: ${matched} transactions match, ${knownSeen.size} known differences, ${failed} unexplained differences.`)
  return failed ? 1 : 0
}

main(process.argv[2]).then(code => process.exit(code)).catch(err => {
  console.error(err)
  process.exit(2)
})
