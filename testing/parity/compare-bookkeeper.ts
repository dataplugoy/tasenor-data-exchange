/**
 * Compare TaDeX results against the expected results of a Tasenor Bookkeeper import test.
 *
 * Usage: npx tsx testing/parity/compare-bookkeeper.ts <path to bookkeeper import test directory>
 *
 * The bookkeeper test directory (e.g. tasenor-qa/tests/import/Dataplug-2022-Nordnet-Hilunki) contains
 * the source CSV, initial `stock.json` and `balance.json`, `settings.json` for account mapping and
 * the expected `transactions.json` and `end-stock.json`.
 *
 * Exchange rates used by the bookkeeper are substituted into the CSV before running, so that
 * differences in rate policy do not hide or cause differences in the logic.
 *
 * NOTE: This resets the development database.
 */
import { execFileSync, spawnSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'

const ROOT = path.resolve(__dirname, '..', '..')
const FLOW = 'Nightly Testing'
const DB = 'postgresql://dev:02u3QD2e3wxssfdr3sxds@localhost:7300/tadex'
// Rounding tolerance in cents for a sum of one category in one transaction.
const TOLERANCE = 1

type Cents = number
type Category = string
type Signature = Record<Category, Cents>
type Segment = { date: string, text: string, amounts: Signature }

interface BookkeeperEntry {
  account: string
  amount: Cents
  description: string
  data?: { rates?: Record<string, number> }
}

interface BookkeeperTransaction {
  date: string
  segmentId: string
  entries: BookkeeperEntry[]
}

interface TadexItem {
  fields: Record<string, string>
  time: string
  lines: { account: string, amount: string, text: string }[]
}

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
 * Map bookkeeper account numbers to categories comparable with TaDeX account codes.
 */
function bookkeeperCategories(settings: Record<string, unknown>): Record<string, Category> {
  const statements: Record<string, Category> = {
    TRADE_PROFIT_STOCK: 'PROFIT',
    TRADE_LOSS_STOCK: 'LOSS',
    LISTED_DIVIDEND: 'DIVIDEND',
    INTEREST_EXPENSE: 'INTEREST',
    WITHHOLDING_TAX: 'TAX',
    STOCK_BROKER_SERVICE_FEE: 'FEE',
    TRADE_PROFIT_CURRENCY: 'FOREX_PL',
    TRADE_LOSS_CURRENCY: 'FOREX_PL',
  }
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
    if ((m = /^account\.\w+\.currency\.(\w+)$/.exec(key))) set(account, `CASH_${m[1]}`)
    else if (/^account\.trade\.stock\./.test(key)) set(account, 'STOCK')
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
 */
function tadexCategory(account: string): Category {
  let m
  if ((m = /^(?:DEBT_)?CURRENCY_(\w+)$/.exec(account))) return `CASH_${m[1]}`
  if (/^EXTERNAL_/.test(account)) return 'EXTERNAL'
  if (account === 'INCOME_DIVIDEND') return 'DIVIDEND'
  if (account === 'EXPENSE_INTEREST') return 'INTEREST'
  // Bookkeeper records monthly savings fee as a broker service fee.
  if (account === 'EXPENSE_MONTHLY_FEE') return 'FEE'
  return account.replace(/_.*/, '')
}

/**
 * Collect setup for TaDeX debt handling: separate debt account only if bookkeeper uses one.
 */
function debtAccounts(settings: Record<string, unknown>, currencies: string[]): Record<string, string | null> {
  const ret: Record<string, string | null> = {}
  for (const currency of currencies) {
    const debt = settings[`account.debt.currency.${currency}`]
    const cash = settings[`account.trade.currency.${currency}`] || settings[`account.deposit.currency.${currency}`] || settings[`account.forex.currency.${currency}`]
    ret[currency] = debt && debt !== cash ? '1001' : null
  }
  return ret
}

/**
 * Read the CSV (UTF-16 or UTF-8) and return header and rows.
 */
function readCsv(file: string): [string[], string[][]] {
  const buf = fs.readFileSync(file)
  const text = buf[0] === 0xff && buf[1] === 0xfe ? buf.toString('utf16le').substring(1) : buf.toString('utf-8')
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '')
  return [lines[0].split('\t'), lines.slice(1).map(l => l.split('\t'))]
}

function writeCsv(file: string, header: string[], rows: string[][]): void {
  const text = [header, ...rows].map(r => r.join('\t')).join('\r\n') + '\r\n'
  fs.writeFileSync(file, Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(text, 'utf16le')]))
}

function segmentKey(fields: Record<string, string>): string {
  return fields.Vahvistusnumero || `row:${fields.Id}`
}

function addTo(sig: Signature, cat: Category, cents: Cents) {
  sig[cat] = (sig[cat] || 0) + cents
}

function differences(a: Signature, b: Signature): [Category, Cents, Cents][] {
  const cats = new Set([...Object.keys(a), ...Object.keys(b)])
  return [...cats].map(c => [c, a[c] || 0, b[c] || 0] as [Category, Cents, Cents]).filter(([, x, y]) => Math.abs(x - y) > TOLERANCE)
}

function euros(cents: Cents): string {
  return (cents / 100).toFixed(2).padStart(12)
}

async function main(testDir: string): Promise<number> {
  testDir = path.resolve(testDir)
  const testName = path.basename(testDir)
  const settings = readJson<Record<string, unknown>>(testDir, 'settings.json')
  const stock = readJson<Record<string, Record<string, { amount: number, value: Cents }>>>(testDir, 'stock.json', {})
  const balance = readJson<Record<string, Cents>>(testDir, 'balance.json', {})
  const endStock = readJson<Record<string, Record<string, { amount: number, value: Cents }>>>(testDir, 'end-stock.json')
  const answers = readJson<Record<string, Record<string, unknown>>>(testDir, 'answers.json', {})
  const expected = readJson<BookkeeperTransaction[]>(testDir, 'transactions.json')
  const known = readJson<Record<string, Record<string, string>>>(path.join(__dirname), 'known-differences.json', {})[testName] || {}
  const csvFiles = fs.readdirSync(testDir).filter(f => f.endsWith('.csv'))
  if (csvFiles.length !== 1) {
    throw new Error(`Expected exactly one CSV in ${testDir}, found ${csvFiles.length}.`)
  }

  const categories = bookkeeperCategories(settings)
  const category = (account: string): Category => categories[account] || `BK_${account}`
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'tadex-parity-'))

  // Substitute exchange rates used by the bookkeeper.
  const bkRates: Record<string, Record<string, number>> = {}
  for (const tx of expected) {
    for (const e of tx.entries) {
      if (e.data?.rates) bkRates[tx.segmentId] = { ...bkRates[tx.segmentId], ...e.data.rates }
    }
  }
  const [header, rows] = readCsv(path.join(testDir, csvFiles[0]))
  const col = (name: string) => header.findIndex(h => h.trim() === name)
  const [cId, cRate, cCurrency, cConfirm, cName] = [col('Id'), col('Vaihtokurssi'), col('Valuutta'), col('Vahvistusnumero'), col('Arvopaperi')]
  const currencies = new Set<string>(['EUR'])
  // Keep instrument names that TaDeX would question as tickers, like bookkeeper does.
  const tickers: Record<string, string> = {}
  let substituted = 0
  for (const row of rows) {
    if (/\s/.test(row[cName])) tickers[row[cName]] = row[cName]
    const currency = row[cCurrency]
    if (currency) currencies.add(currency)
    const rate = bkRates[row[cConfirm]]?.[currency] ?? bkRates[`row:${row[cId]}`]?.[currency]
    if (rate !== undefined && currency !== 'EUR') {
      row[cRate] = `${rate}`.replace('.', ',')
      substituted++
    }
  }
  writeCsv(path.join(work, 'input.csv'), header, rows)

  // Initial stock with manual renamings applied.
  const renames: Record<string, string> = {}
  for (const r of (answers['']?.['asset-renaming'] || []) as { old: string, new: string }[]) {
    renames[r.old] = r.new
  }
  const stockAccounts = Object.keys(stock)
  if (stockAccounts.length > 1) {
    throw new Error(`Multiple stock accounts ${stockAccounts} not supported.`)
  }
  const initStock = stockAccounts.length ? stock[stockAccounts[0]] : {}
  fs.writeFileSync(path.join(work, 'stock.csv'), Object.entries(initStock)
    .filter(([, s]) => s.amount !== 0)
    .map(([ticker, s]) => `${renames[ticker] || ticker},${s.amount},${s.value / 100}\n`).join(''))

  // Initial cash balances.
  const debts = debtAccounts(settings, [...currencies])
  const cash: Record<string, Cents> = {}
  for (const [account, cents] of Object.entries(balance)) {
    const m = /^CASH_(\w+)$/.exec(category(account))
    if (!m) continue
    const isDebt = debts[m[1]] !== null && settings[`account.debt.currency.${m[1]}`] === account
    const code = `${isDebt ? 'DEBT_' : ''}CURRENCY_${m[1]}`
    cash[code] = (cash[code] || 0) + cents
  }
  fs.writeFileSync(path.join(work, 'balance.csv'), Object.entries(cash).map(([code, cents]) => `${code},${cents / 100}\n`).join(''))

  // Run TaDeX.
  console.log(`Running ${testName} (${rows.length} rows, ${substituted} rates substituted, work dir ${work}).`)
  execFileSync('pnpm', ['load'], { cwd: path.join(ROOT, 'database'), stdio: 'ignore' })
  tadex('setup', FLOW, JSON.stringify({
    accountGrouping: { singleStockAccount: true, singleFeeAccount: true, singleProfitAccount: true, singleLossAccount: true, singleDividendAccount: true, singleTaxAccount: true },
    tickers,
    settings: { debtAccounts: debts, allowShortSelling: !!settings.allowShortSelling }
  }))
  tadex('init-stock', FLOW, 'STOCK', path.join(work, 'stock.csv'))
  tadex('init-balance', FLOW, path.join(work, 'balance.csv'))
  tadex('run', FLOW)
  tadex('upload', FLOW, path.join(work, 'input.csv'))
  const log = tadex('run', FLOW, 'all')
  fs.writeFileSync(path.join(work, 'run.log'), log)
  const questions = log.split('\n').filter(l => /ANSWERS_REQUIRED|Run not successful|Error:/.test(l))
  if (questions.length) {
    console.log(questions.join('\n'))
    console.log(`FAILED: TaDeX run did not complete for ${testName}.`)
    return 1
  }

  // Collect TaDeX results.
  const dump = execFileSync('docker', ['exec', 'tadex-db', 'psql', '-At', DB, '-c',
    `select coalesce(json_agg(json_build_object('fields', i.data->'fields', 'time', o.data->'time', 'lines', o.data->'lines')), '[]')
     from output_items o join unified_items u on u.id = o."unifiedId" join input_items i on i.id = u."inputId"
     join flow_plans f on f.id = o."flowPlanId" where f.title = '${FLOW}'`
  ]).toString('utf-8')
  const items: TadexItem[] = JSON.parse(dump)

  const bk: Record<string, Segment> = {}
  for (const tx of expected) {
    const seg = bk[tx.segmentId] = bk[tx.segmentId] || { date: tx.date.substring(0, 10), text: tx.entries[0]?.description || '', amounts: {} }
    tx.entries.forEach(e => addTo(seg.amounts, category(e.account), e.amount))
  }
  const td: Record<string, Segment> = {}
  for (const item of items) {
    const key = segmentKey(item.fields)
    const seg = td[key] = td[key] || { date: item.time.substring(0, 10), text: item.lines[0]?.text || '', amounts: {} }
    item.lines.forEach(l => addTo(seg.amounts, tadexCategory(l.account), Math.round(parseFloat(l.amount) * 100)))
  }

  // Match segments by key first and then by date and amounts.
  const pairs: [string, Segment | null, Segment | null][] = []
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

  // Report.
  let failed = 0
  let matched = 0
  const knownSeen = new Set<string>()
  for (const [key, b, t] of pairs.sort((x, y) => ((x[1] || x[2])!.date).localeCompare((y[1] || y[2])!.date))) {
    const diffs = differences(b?.amounts || {}, t?.amounts || {})
    if (!diffs.length) {
      matched++
      continue
    }
    const reason = known[key]
    if (reason) knownSeen.add(key)
    else failed++
    console.log(`${reason ? 'KNOWN' : 'DIFF '} #${key} ${(b || t)!.date}  BK: ${b?.text || '-'}  |  TaDeX: ${t?.text || '-'}`)
    if (reason) console.log(`      ${reason}`)
    diffs.forEach(([cat, x, y]) => console.log(`      ${cat.padEnd(16)} BK ${euros(x)}  TaDeX ${euros(y)}`))
  }
  for (const key of Object.keys(known)) {
    if (!knownSeen.has(key)) {
      console.log(`STALE known difference #${key} no longer differs: ${known[key]}`)
      failed++
    }
  }

  // Compare final stock amounts.
  const ledger = JSON.parse(tadex('ledger', FLOW, '--stock', '--json').replace(/^[^{]*/s, ''))
  const finalStock = endStock[Object.keys(endStock)[0]] || {}
  const allTickers = new Set<string>([
    ...Object.keys(finalStock),
    ...Object.keys(initStock).map(t => renames[t] || t),
    ...Object.keys(ledger).filter(k => k.startsWith('STOCK: ')).map(k => k.substring(7)),
  ])
  for (const ticker of allTickers) {
    const initial = Object.entries(initStock).filter(([t]) => (renames[t] || t) === ticker).reduce((sum, [, s]) => sum + s.amount, 0)
    const change = parseFloat((ledger[`STOCK: ${ticker}`] || '0 x 0').split(' x ')[0])
    const want = finalStock[ticker]?.amount || 0
    if (Math.abs(initial + change - want) > 1e-9) {
      console.log(`DIFF  stock ${ticker}: BK ${want}  TaDeX ${initial + change}`)
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
