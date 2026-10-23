/**
 * Common parts of the comparisons of TaDeX against the expected results of Tasenor Bookkeeper import tests.
 */
import { execFileSync, spawnSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { isCurrency } from '@tasenor/common'

export const ROOT = path.resolve(__dirname, '..', '..')
export const DB = 'postgresql://dev:02u3QD2e3wxssfdr3sxds@localhost:7300/tadex'
// Rounding tolerance in cents for a sum of one category in one transaction.
const TOLERANCE = 1

export type Cents = number
export type Category = string
export type Signature = Record<Category, Cents>
export type Segment = { date: string, text: string, amounts: Signature }
export type Pair = [string, Segment | null, Segment | null]
export type StockData = Record<string, Record<string, { amount: number, value: Cents }>>

export interface BookkeeperEntry {
  account: string
  amount: Cents
  description: string
  data?: { rates?: Record<string, number> }
}

export interface BookkeeperTransaction {
  date: string
  segmentId: string
  entries: BookkeeperEntry[]
}

export interface TadexItem {
  fields: Record<string, string>
  time: string
  lines: { account: string, amount: string, text: string }[]
}

/**
 * All data of a bookkeeper import test.
 */
export interface BookkeeperTest {
  dir: string
  name: string
  settings: Record<string, unknown>
  stock: StockData
  balance: Record<string, Cents>
  endStock: StockData
  answers: Record<string, Record<string, unknown>>
  expected: BookkeeperTransaction[]
  known: Record<string, string>
}

export function readJson<T>(dir: string, file: string, def: T | null = null): T {
  const p = path.join(dir, file)
  if (!fs.existsSync(p)) {
    if (def !== null) return def
    throw new Error(`Missing ${p}.`)
  }
  return JSON.parse(fs.readFileSync(p).toString('utf-8'))
}

export function readTest(testDir: string): BookkeeperTest {
  const dir = path.resolve(testDir)
  const name = path.basename(dir)
  return {
    dir,
    name,
    settings: readJson(dir, 'settings.json'),
    stock: readJson(dir, 'stock.json', {}),
    balance: readJson(dir, 'balance.json', {}),
    endStock: readJson(dir, 'end-stock.json'),
    answers: readJson(dir, 'answers.json', {}),
    expected: readJson(dir, 'transactions.json'),
    known: readJson<Record<string, Record<string, string>>>(__dirname, 'known-differences.json', {})[name] || {},
  }
}

export function tadex(...args: string[]): string {
  const res = spawnSync(path.join(ROOT, 'bin', 'tadex.mjs'), args, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] })
  const out = `${res.stdout}${res.stderr}`
  if (res.status !== 0) {
    throw new Error(`Command 'tadex ${args.join(' ')}' failed:\n${out.split('\n').filter(l => !/^\s+at /.test(l)).slice(-20).join('\n')}`)
  }
  return out
}

/**
 * Reset the development database to the test snapshot.
 */
export function loadDatabase(): void {
  execFileSync('pnpm', ['load'], { cwd: path.join(ROOT, 'database'), stdio: 'ignore' })
}

export function sql(query: string): string {
  return execFileSync('docker', ['exec', 'tadex-db', 'psql', '-At', DB, '-c', query]).toString('utf-8')
}

/**
 * Confirm the balances and assets of the flow plan, given by hand before the run, as its opening state. The user does
 * the same when asked before the first batch.
 */
export function confirmOpeningState(flow: string): void {
  sql(`update flow_plans set setup = jsonb_set(setup, '{openingState}', jsonb_build_object('date', '1900-01-01', 'sources', '[]'::jsonb, 'notes', '[]'::jsonb, 'balance', balance, 'stock', stock)) where title = '${flow.replace(/'/g, "''")}'`)
}

/**
 * Map bookkeeper account numbers to categories comparable with TaDeX account codes.
 * @param statements Categories of bookkeeper statement accounts by their names.
 */
export function bookkeeperCategories(settings: Record<string, unknown>, statements: Record<string, Category>): Record<string, Category> {
  const map: Record<string, Category> = {}
  const set = (account: unknown, cat: Category) => {
    if (typeof account !== 'string') return
    if (map[account] && map[account] !== cat) {
      throw new Error(`Bookkeeper account ${account} maps to both ${map[account]} and ${cat}.`)
    }
    map[account] = cat
  }
  for (const [key, account] of Object.entries(settings)) {
    let m
    if (/^account\.fee\./.test(key)) continue
    if ((m = /^account\.\w+\.currency\.([A-Z]{3})$/.exec(key))) set(account, `CASH_${m[1]}`)
    else if (/^account\.\w+\.(stock|short|crypto)\./.test(key)) set(account, 'STOCK')
    else if (/^account\.\w+\.external\./.test(key)) set(account, 'EXTERNAL')
    else if ((m = /^account\.\w+\.statement\.(\w+)$/.exec(key))) set(account, statements[m[1]] || m[1])
  }
  // Fee settings may point to the cash account the fee is paid from, so those are the lowest priority.
  for (const [key, account] of Object.entries(settings)) {
    if (/^account\.fee\./.test(key) && typeof account === 'string' && !map[account]) map[account] = 'FEE'
  }
  return map
}

/**
 * Map TaDeX account codes to categories.
 * @param categories Categories of TaDeX accounts overriding the defaults.
 */
export function tadexCategory(account: string, categories: Record<string, Category> = {}): Category {
  let m
  if (categories[account]) return categories[account]
  if ((m = /^(?:DEBT_)?CURRENCY_(\w+)$/.exec(account))) return `CASH_${m[1]}`
  if (/^EXTERNAL_/.test(account)) return 'EXTERNAL'
  if (account === 'INCOME_DIVIDEND') return 'DIVIDEND'
  if (account === 'EXPENSE_INTEREST') return 'INTEREST'
  if (account === 'FOREX_PROFIT' || account === 'FOREX_LOSS') return 'FOREX_PL'
  return account.replace(/_.*/, '')
}

/**
 * Collect setup for TaDeX debt handling: separate debt account only if bookkeeper uses one.
 */
export function debtAccounts(settings: Record<string, unknown>, currencies: string[]): Record<string, string | null> {
  const ret: Record<string, string | null> = {}
  for (const currency of currencies) {
    const debt = settings[`account.debt.currency.${currency}`]
    const cash = settings[`account.trade.currency.${currency}`] || settings[`account.deposit.currency.${currency}`] || settings[`account.forex.currency.${currency}`]
    ret[currency] = debt && debt !== cash ? '1001' : null
  }
  return ret
}

/**
 * Write initial cash balances of the bookkeeper test as TaDeX account codes.
 */
export function writeBalances(file: string, test: BookkeeperTest, category: (account: string) => Category, debts: Record<string, string | null>): void {
  const cash: Record<string, Cents> = {}
  for (const [account, cents] of Object.entries(test.balance)) {
    const m = /^CASH_(\w+)$/.exec(category(account))
    if (!m) continue
    const isDebt = debts[m[1]] !== null && test.settings[`account.debt.currency.${m[1]}`] === account
    const code = `${isDebt ? 'DEBT_' : ''}CURRENCY_${m[1]}`
    cash[code] = (cash[code] || 0) + cents
  }
  fs.writeFileSync(file, Object.entries(cash).map(([code, cents]) => `${code},${cents / 100}\n`).join(''))
}

/**
 * Write initial stock of the bookkeeper test, combining all stock accounts.
 */
export function writeStock(file: string, stock: Record<string, { amount: number, value: Cents }>, renames: Record<string, string>): void {
  fs.writeFileSync(file, Object.entries(stock)
    .filter(([, s]) => s.amount !== 0)
    .map(([ticker, s]) => `${renames[ticker] || ticker},${s.amount},${s.value / 100}\n`).join(''))
}

/**
 * Combine all stock accounts to one.
 */
export function combinedStock(stock: StockData): Record<string, { amount: number, value: Cents }> {
  const ret: Record<string, { amount: number, value: Cents }> = {}
  for (const account of Object.values(stock)) {
    for (const [ticker, s] of Object.entries(account)) {
      ret[ticker] = ret[ticker] || { amount: 0, value: 0 }
      ret[ticker].amount += s.amount
      ret[ticker].value += s.value
    }
  }
  return ret
}

/**
 * Run the full processing of the flow and check that it completed.
 * @returns Log of the run or null, if it did not complete.
 */
export function runFlow(flow: string, work: string): string | null {
  const log = tadex('run', flow, 'all')
  fs.writeFileSync(path.join(work, 'run.log'), log)
  const questions = log.split('\n').filter(l => /ANSWERS_REQUIRED|Run not successful|Error:/.test(l))
  if (questions.length) {
    console.log(questions.join('\n'))
    return null
  }
  return log
}

/**
 * Get the input fields, time and transaction lines of all outputs of the flow.
 */
export function collectItems(flow: string): TadexItem[] {
  return JSON.parse(sql(
    `select coalesce(json_agg(json_build_object('fields', i.data->'fields', 'time', o.data->'time', 'lines', o.data->'lines')), '[]')
     from output_items o join unified_items u on u.id = o."unifiedId" join input_items i on i.id = u."inputId"
     join flow_plans f on f.id = o."flowPlanId" where f.title = '${flow}'`
  ))
}

export function addTo(sig: Signature, cat: Category, cents: Cents) {
  sig[cat] = (sig[cat] || 0) + cents
}

export function differences(a: Signature, b: Signature): [Category, Cents, Cents][] {
  const cats = new Set([...Object.keys(a), ...Object.keys(b)])
  return [...cats].map(c => [c, a[c] || 0, b[c] || 0] as [Category, Cents, Cents]).filter(([, x, y]) => Math.abs(x - y) > TOLERANCE)
}

export function euros(cents: Cents): string {
  return (cents / 100).toFixed(2).padStart(12)
}

/**
 * Collect bookkeeper transactions to segments by segment ID.
 */
export function bookkeeperSegments(expected: BookkeeperTransaction[], category: (account: string) => Category): Record<string, Segment> {
  const bk: Record<string, Segment> = {}
  for (const tx of expected) {
    const seg = bk[tx.segmentId] = bk[tx.segmentId] || { date: tx.date.substring(0, 10), text: tx.entries[0]?.description || '', amounts: {} }
    tx.entries.forEach(e => addTo(seg.amounts, category(e.account), e.amount))
  }
  return bk
}

/**
 * Collect TaDeX outputs to segments by the given key.
 */
export function tadexSegments(items: TadexItem[], key: (fields: Record<string, string>) => string, category: (account: string) => Category): Record<string, Segment> {
  const td: Record<string, Segment> = {}
  for (const item of items) {
    const k = key(item.fields)
    const seg = td[k] = td[k] || { date: item.time.substring(0, 10), text: item.lines[0]?.text || '', amounts: {} }
    item.lines.forEach(l => addTo(seg.amounts, category(l.account), Math.round(parseFloat(l.amount) * 100)))
  }
  return td
}

/**
 * Match segments by key first and then by date and amounts. Pairs without counterpart have null on the other side.
 */
export function matchSegments(bk: Record<string, Segment>, td: Record<string, Segment>): Pair[] {
  bk = { ...bk }
  td = { ...td }
  const pairs: Pair[] = []
  for (const key of Object.keys(bk)) {
    if (td[key]) {
      pairs.push([key, bk[key], td[key]])
      delete td[key]
      delete bk[key]
    }
  }
  for (const [key, seg] of Object.entries(bk)) {
    const match = Object.entries(td).find(([, t]) => t.date === seg.date && differences(seg.amounts, t.amounts).length === 0)
    if (match) {
      pairs.push([key, seg, match[1]])
      delete td[match[0]]
      delete bk[key]
    }
  }
  // TaDeX may combine several rows (e.g. interest in different currencies) that bookkeeper records separately.
  for (const [key, seg] of Object.entries(td)) {
    const group = Object.entries(bk).filter(([, b]) => b.date === seg.date)
    const sum: Signature = {}
    group.forEach(([, b]) => Object.entries(b.amounts).forEach(([cat, cents]) => addTo(sum, cat, cents)))
    if (group.length > 1 && differences(sum, seg.amounts).length === 0) {
      pairs.push([group.map(([k]) => k).join('+'), { ...seg, amounts: sum }, seg])
      group.forEach(([k]) => delete bk[k])
      delete td[key]
    }
  }
  for (const [key, seg] of Object.entries(bk)) {
    pairs.push([key, seg, null])
  }
  for (const [key, seg] of Object.entries(td)) {
    pairs.push([key, null, seg])
  }
  return pairs
}

/**
 * Find the explanation of a known difference. A known key ending with `*` matches keys with that prefix.
 */
function knownReason(known: Record<string, string>, key: string): [string, string] | null {
  if (known[key]) return [key, known[key]]
  const pattern = Object.keys(known).find(k => k.endsWith('*') && key.startsWith(k.substring(0, k.length - 1)))
  return pattern ? [pattern, known[pattern]] : null
}

/**
 * Report differences of the pairs.
 * @returns Number of matching pairs, number of known differences and number of unexplained differences.
 */
export function reportPairs(pairs: Pair[], known: Record<string, string>): [number, number, number] {
  let failed = 0
  let matched = 0
  let knownCount = 0
  const knownSeen = new Set<string>()
  for (const [key, b, t] of pairs.sort((x, y) => ((x[1] || x[2])!.date).localeCompare((y[1] || y[2])!.date))) {
    const diffs = differences(b?.amounts || {}, t?.amounts || {})
    if (!diffs.length) {
      matched++
      continue
    }
    const reason = knownReason(known, key)
    if (reason) {
      knownSeen.add(reason[0])
      knownCount++
    } else {
      failed++
    }
    console.log(`${reason ? 'KNOWN' : 'DIFF '} #${key} ${(b || t)!.date}  BK: ${b?.text || '-'}  |  TaDeX: ${t?.text || '-'}`)
    if (reason) console.log(`      ${reason[1]}`)
    diffs.forEach(([cat, x, y]) => console.log(`      ${cat.padEnd(16)} BK ${euros(x)}  TaDeX ${euros(y)}`))
  }
  for (const key of Object.keys(known)) {
    if (!knownSeen.has(key) && !key.startsWith('stock:')) {
      console.log(`STALE known difference #${key} no longer differs: ${known[key]}`)
      failed++
    }
  }
  return [matched, knownCount, failed]
}

/**
 * Compare final stock amounts.
 * @returns Number of differences.
 */
export function compareStock(flow: string, initStock: Record<string, { amount: number }>, finalStock: Record<string, { amount: number }>, renames: Record<string, string>, known: Record<string, string> = {}, account = 'STOCK'): number {
  // Output may contain log lines and warnings around the JSON object.
  const ledgerOut = tadex('ledger', flow, '--stock', '--json')
  const ledger = JSON.parse(ledgerOut.substring(ledgerOut.indexOf('{'), ledgerOut.lastIndexOf('}') + 1))
  const allTickers = new Set<string>([
    ...Object.keys(finalStock),
    ...Object.keys(initStock).map(t => renames[t] || t),
    ...Object.keys(ledger).filter(k => k.startsWith(`${account}: `)).map(k => k.substring(account.length + 2)),
  ])
  let failed = 0
  for (const ticker of allTickers) {
    const initial = Object.entries(initStock).filter(([t]) => (renames[t] || t) === ticker).reduce((sum, [, s]) => sum + s.amount, 0)
    const change = parseFloat((ledger[`${account}: ${ticker}`] || '0 x 0').split(' x ')[0])
    const want = finalStock[ticker]?.amount || 0
    if (Math.abs(initial + change - want) > 1e-9) {
      const reason = known[`stock:${ticker}`]
      console.log(`${reason ? 'KNOWN' : 'DIFF '} stock ${ticker}: BK ${want}  TaDeX ${initial + change}`)
      if (reason) console.log(`      ${reason}`)
      else failed++
    }
  }
  return failed
}

/**
 * Write bookkeeper rates `{ date: { asset: rate } }` for the JSON file rate service as `<name>-EUR.json`. Days
 * without a rate use the latest earlier rate.
 * @returns Currencies and crypto assets found.
 */
export function writeRates(name: string, rates: Record<string, Record<string, string | number>>): { currencies: string[], crypto: string[] } {
  const byAsset: Record<string, Record<string, string>> = {}
  for (const [date, values] of Object.entries(rates)) {
    for (const [asset, rate] of Object.entries(values)) {
      byAsset[asset] = byAsset[asset] || {}
      byAsset[asset][date] = `${rate}`
    }
  }
  for (const [asset, known] of Object.entries(byAsset)) {
    const dates = Object.keys(known).sort()
    const filled: Record<string, string> = {}
    let latest = known[dates[0]]
    const end = Date.parse(`${dates[dates.length - 1].substring(0, 4)}-12-31T00:00:00Z`)
    for (let day = Date.parse(`${dates[0].substring(0, 4)}-01-01T00:00:00Z`); day <= end; day += 24 * 60 * 60 * 1000) {
      const date = new Date(day).toISOString().substring(0, 10)
      latest = known[date] || latest
      filled[date] = latest
    }
    byAsset[asset] = filled
  }
  const currencies = Object.keys(byAsset).filter(a => isCurrency(a))
  const crypto = Object.keys(byAsset).filter(a => !isCurrency(a))
  fs.writeFileSync(path.join(ROOT, 'backend', 'samples', `${name}-EUR.json`), JSON.stringify({
    crypto: Object.fromEntries(crypto.map(a => [a, byAsset[a]])),
    currency: Object.fromEntries(currencies.map(a => [a, byAsset[a]])),
  }, null, 2))
  return { currencies, crypto }
}

/**
 * Options for comparing an import of one file against a bookkeeper import test.
 */
export interface ImportComparison {
  flow: string
  // The file to upload.
  input: string
  // Instrument names to use as they are.
  tickers: string[]
  // Account code for the initial stock.
  stockAccount: string
  // Categories of bookkeeper statement accounts and TaDeX accounts.
  statements: Record<string, Category>
  tadexCategories: Record<string, Category>
  // Key of the TaDeX segment from the input fields.
  segmentKey: (fields: Record<string, string>) => string
  // Additional settings for the flow.
  settings?: Record<string, unknown>
  // Additional account grouping for the flow.
  grouping?: Record<string, boolean>
}

/**
 * Run the import in TaDeX with the initial state and rates of the bookkeeper test and compare the results.
 * @returns Exit code.
 */
export function compareImport(test: BookkeeperTest, opts: ImportComparison): number {
  const RATES = 'parity-rates'
  const categories = bookkeeperCategories(test.settings, opts.statements)
  const category = (account: string): Category => categories[account] || `BK_${account}`
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'tadex-parity-'))

  // Corrections of the initial stock for events missing from the source.
  const initStock = combinedStock(test.stock)
  const corrections = readJson<Record<string, Record<string, { amount: number, value: number, reason: string }>>>(__dirname, 'stock-corrections.json', {})[test.name] || {}
  for (const [ticker, fix] of Object.entries(corrections)) {
    console.log(`CORRECTION stock ${ticker} ${fix.amount > 0 ? '+' : ''}${fix.amount}: ${fix.reason}`)
    initStock[ticker] = { amount: (initStock[ticker]?.amount || 0) + fix.amount, value: (initStock[ticker]?.value || 0) + fix.value }
  }
  writeStock(path.join(work, 'stock.csv'), initStock, {})
  const rates = writeRates(RATES, readJson(test.dir, 'rates.json', {}))
  const debts = debtAccounts(test.settings, ['EUR', ...rates.currencies])
  writeBalances(path.join(work, 'balance.csv'), test, category, debts)

  // Run TaDeX.
  console.log(`Running ${test.name} (work dir ${work}).`)
  loadDatabase()
  sql(`update services set settings = '{"url": "file:///${RATES}.json"}' where driver = 'JSON_FILE'`)
  tadex('setup', opts.flow, JSON.stringify({
    accountGrouping: { singleStockAccount: true, singleFeeAccount: true, singleProfitAccount: true, singleLossAccount: true, singleDividendAccount: true, singleTaxAccount: true, ...opts.grouping },
    tickers: Object.fromEntries(opts.tickers.map(t => [t, t])),
    settings: { debtAccounts: debts, allowShortSelling: !!test.settings.allowShortSelling, ...opts.settings }
  }))
  tadex('init-stock', opts.flow, opts.stockAccount, path.join(work, 'stock.csv'))
  tadex('init-balance', opts.flow, path.join(work, 'balance.csv'))
  confirmOpeningState(opts.flow)
  tadex('run', opts.flow)
  tadex('upload', opts.flow, opts.input)
  if (runFlow(opts.flow, work) === null) {
    console.log(`FAILED: TaDeX run did not complete for ${test.name}.`)
    return 1
  }

  const bk = bookkeeperSegments(test.expected, category)
  const td = tadexSegments(collectItems(opts.flow), opts.segmentKey, account => tadexCategory(account, opts.tadexCategories))
  const [matched, knownCount, failed] = reportPairs(matchSegments(bk, td), test.known)
  const stockFailed = compareStock(opts.flow, initStock, combinedStock(test.endStock), {}, test.known, opts.stockAccount)

  console.log(`${test.name}: ${matched} transactions match, ${knownCount} known differences, ${failed + stockFailed} unexplained differences.`)
  return failed + stockFailed ? 1 : 0
}
