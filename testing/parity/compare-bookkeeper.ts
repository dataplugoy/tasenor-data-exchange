/**
 * Compare TaDeX results against the expected results of a Tasenor Bookkeeper Nordnet import test.
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
import fs from 'fs'
import os from 'os'
import path from 'path'
import {
  Category, bookkeeperCategories, bookkeeperSegments, collectItems, compareStock, confirmOpeningState, debtAccounts, loadDatabase, matchSegments,
  readTest, reportPairs, runFlow, tadex, tadexCategory, tadexSegments, writeBalances, writeStock
} from './parity-lib'

const FLOW = 'Nightly Testing'

const STATEMENTS: Record<string, Category> = {
  TRADE_PROFIT_STOCK: 'PROFIT',
  TRADE_LOSS_STOCK: 'LOSS',
  LISTED_DIVIDEND: 'DIVIDEND',
  INTEREST_EXPENSE: 'INTEREST',
  WITHHOLDING_TAX: 'TAX',
  STOCK_BROKER_SERVICE_FEE: 'FEE',
  TRADE_PROFIT_CURRENCY: 'FOREX_PL',
  TRADE_LOSS_CURRENCY: 'FOREX_PL',
}

// Bookkeeper records monthly savings fee as a broker service fee.
const TADEX_CATEGORIES: Record<string, Category> = {
  EXPENSE_MONTHLY_FEE: 'FEE',
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

async function main(testDir: string): Promise<number> {
  const test = readTest(testDir)
  const { settings, stock, answers, expected, known } = test
  const csvFiles = fs.readdirSync(test.dir).filter(f => f.endsWith('.csv'))
  if (csvFiles.length !== 1) {
    throw new Error(`Expected exactly one CSV in ${test.dir}, found ${csvFiles.length}.`)
  }

  const categories = bookkeeperCategories(settings, STATEMENTS)
  const category = (account: string): Category => categories[account] || `BK_${account}`
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'tadex-parity-'))

  // Substitute exchange rates used by the bookkeeper.
  const bkRates: Record<string, Record<string, number>> = {}
  for (const tx of expected) {
    for (const e of tx.entries) {
      if (e.data?.rates) bkRates[tx.segmentId] = { ...bkRates[tx.segmentId], ...e.data.rates }
    }
  }
  const [header, rows] = readCsv(path.join(test.dir, csvFiles[0]))
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
  writeStock(path.join(work, 'stock.csv'), initStock, renames)

  // Initial cash balances.
  const debts = debtAccounts(settings, [...currencies])
  writeBalances(path.join(work, 'balance.csv'), test, category, debts)

  // Run TaDeX.
  console.log(`Running ${test.name} (${rows.length} rows, ${substituted} rates substituted, work dir ${work}).`)
  loadDatabase()
  tadex('setup', FLOW, JSON.stringify({
    accountGrouping: { singleStockAccount: true, singleFeeAccount: true, singleProfitAccount: true, singleLossAccount: true, singleDividendAccount: true, singleTaxAccount: true },
    tickers,
    settings: { debtAccounts: debts, allowShortSelling: !!settings.allowShortSelling }
  }))
  tadex('init-stock', FLOW, 'STOCK', path.join(work, 'stock.csv'))
  tadex('init-balance', FLOW, path.join(work, 'balance.csv'))
  confirmOpeningState(FLOW)
  tadex('run', FLOW)
  tadex('upload', FLOW, path.join(work, 'input.csv'))
  if (runFlow(FLOW, work) === null) {
    console.log(`FAILED: TaDeX run did not complete for ${test.name}.`)
    return 1
  }

  const bk = bookkeeperSegments(expected, category)
  const td = tadexSegments(collectItems(FLOW), segmentKey, account => tadexCategory(account, TADEX_CATEGORIES))
  const [matched, knownCount, failed] = reportPairs(matchSegments(bk, td), known)
  const finalStock = test.endStock[Object.keys(test.endStock)[0]] || {}
  const stockFailed = compareStock(FLOW, initStock, finalStock, renames, known)

  console.log(`${test.name}: ${matched} transactions match, ${knownCount} known differences, ${failed + stockFailed} unexplained differences.`)
  return failed + stockFailed ? 1 : 0
}

main(process.argv[2]).then(code => process.exit(code)).catch(err => {
  console.error(err)
  process.exit(2)
})
