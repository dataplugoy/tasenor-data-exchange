/**
 * Compare TaDeX results against the expected results of a Tasenor Bookkeeper Lynx import test.
 *
 * Usage: npx tsx testing/parity/compare-lynx.ts <path to bookkeeper import test directory>
 *
 * The bookkeeper test directory (e.g. tasenor-qa/tests/import/Dataplug-2022-Lynx) contains the statement `Lynx.csv`,
 * initial `stock.json` and `balance.json`, `settings.json` for account mapping, exchange rates `rates.json` and the
 * expected `transactions.json` and `end-stock.json`.
 *
 * Lynx statements have no exchange rates. The rates used by the bookkeeper are given to TaDeX through the JSON file
 * rate service, so that differences in rate policy do not hide or cause differences in the logic.
 *
 * NOTE: This resets the development database and changes the rate service of the test user.
 */
import fs from 'fs'
import os from 'os'
import path from 'path'
import { lynxItems, lynxPeriod, parseLynxRows } from '../../backend/src/lib/lynx'
import {
  Category, ROOT, bookkeeperCategories, bookkeeperSegments, collectItems, combinedStock, compareStock, debtAccounts, loadDatabase,
  matchSegments, readJson, readTest, reportPairs, runFlow, sql, tadex, tadexCategory, tadexSegments, writeBalances, writeStock
} from './parity-lib'

const FLOW = 'Lynx Testing'
const RATES = 'parity-rates'

const STATEMENTS: Record<string, Category> = {
  TRADE_PROFIT_STOCK: 'PROFIT',
  TRADE_PROFIT_SHORT: 'PROFIT',
  TRADE_LOSS_STOCK: 'LOSS',
  LISTED_CASH_DIVIDEND: 'DIVIDEND',
  LISTED_STOCK_DIVIDEND: 'DIVIDEND',
  INTEREST_EXPENSE: 'INTEREST',
  STOCK_BROKER_INACTIVITY_FEE: 'FEE',
  TRADE_PROFIT_CURRENCY: 'FOREX_PL',
  TRADE_LOSS_CURRENCY: 'FOREX_PL',
  // Bookkeeper uses the same account for the withholding tax and all corrections.
  WITHHOLDING_TAX: 'TAX',
  INCOME_CORRECTION_WITHHOLDING_TAX: 'TAX',
  INCOME_CORRECTION_DEPOSIT: 'TAX',
  NEEDS_MANUAL_INSPECTION: 'EXTERNAL',
}

const TADEX_CATEGORIES: Record<string, Category> = {
  INCOME_STOCK_DIVIDEND: 'DIVIDEND',
  EXPENSE_BROKER_FEE: 'FEE',
  INCOME_CORRECTION_DEPOSIT: 'TAX',
  EXPENSE_CORRECTION_WITHDRAWAL: 'TAX',
}

/**
 * Write bookkeeper rates for the JSON file rate service. Days without a rate use the latest earlier rate.
 */
function writeRates(rates: Record<string, Record<string, string>>): string[] {
  const byCurrency: Record<string, Record<string, string>> = {}
  for (const [date, values] of Object.entries(rates)) {
    for (const [currency, rate] of Object.entries(values)) {
      byCurrency[currency] = byCurrency[currency] || {}
      byCurrency[currency][date] = `${rate}`
    }
  }
  for (const [currency, known] of Object.entries(byCurrency)) {
    const dates = Object.keys(known).sort()
    const filled: Record<string, string> = {}
    let latest = known[dates[0]]
    const end = Date.parse(`${dates[dates.length - 1].substring(0, 4)}-12-31T00:00:00Z`)
    for (let day = Date.parse(`${dates[0].substring(0, 4)}-01-01T00:00:00Z`); day <= end; day += 24 * 60 * 60 * 1000) {
      const date = new Date(day).toISOString().substring(0, 10)
      latest = known[date] || latest
      filled[date] = latest
    }
    byCurrency[currency] = filled
  }
  fs.writeFileSync(path.join(ROOT, 'backend', 'samples', `${RATES}-EUR.json`), JSON.stringify({ crypto: {}, currency: byCurrency }, null, 2))
  return Object.keys(byCurrency)
}

async function main(testDir: string): Promise<number> {
  const test = readTest(testDir)
  const { settings, expected, known } = test
  const input = path.join(test.dir, 'Lynx.csv')
  const text = fs.readFileSync(input).toString('utf-8')
  const items = lynxItems(parseLynxRows(text), lynxPeriod(text)?.start || null)

  const categories = bookkeeperCategories(settings, STATEMENTS)
  const category = (account: string): Category => categories[account] || `BK_${account}`
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'tadex-parity-'))

  // Instrument names are used as they are, like bookkeeper does.
  const tickers: Record<string, string> = {}
  for (const item of items) {
    for (const field of ['Symbol', 'InSymbol', 'OutSymbol']) {
      const symbol = item.fields[field]
      if (typeof symbol === 'string' && symbol !== '') tickers[symbol] = symbol
    }
  }

  // Corrections of the initial stock for events missing from the statement.
  const initStock = combinedStock(test.stock)
  const corrections = readJson<Record<string, Record<string, { amount: number, value: number, reason: string }>>>(__dirname, 'stock-corrections.json', {})[test.name] || {}
  for (const [ticker, fix] of Object.entries(corrections)) {
    console.log(`CORRECTION stock ${ticker} ${fix.amount > 0 ? '+' : ''}${fix.amount}: ${fix.reason}`)
    initStock[ticker] = { amount: (initStock[ticker]?.amount || 0) + fix.amount, value: (initStock[ticker]?.value || 0) + fix.value }
  }
  writeStock(path.join(work, 'stock.csv'), initStock, {})
  const currencies = ['EUR', ...writeRates(readJson(test.dir, 'rates.json'))]
  const debts = debtAccounts(settings, currencies)
  writeBalances(path.join(work, 'balance.csv'), test, category, debts)

  // Run TaDeX.
  console.log(`Running ${test.name} (${items.length} items, work dir ${work}).`)
  loadDatabase()
  sql(`update services set settings = '{"url": "file:///${RATES}.json"}' where driver = 'JSON_FILE'`)
  tadex('setup', FLOW, JSON.stringify({
    accountGrouping: { singleStockAccount: true, singleFeeAccount: true, singleProfitAccount: true, singleLossAccount: true, singleDividendAccount: true, singleTaxAccount: true },
    tickers,
    settings: { debtAccounts: debts, allowShortSelling: !!settings.allowShortSelling }
  }))
  tadex('init-stock', FLOW, 'STOCK', path.join(work, 'stock.csv'))
  tadex('init-balance', FLOW, path.join(work, 'balance.csv'))
  tadex('run', FLOW)
  tadex('upload', FLOW, input)
  if (runFlow(FLOW, work) === null) {
    console.log(`FAILED: TaDeX run did not complete for ${test.name}.`)
    return 1
  }

  const bk = bookkeeperSegments(expected, category)
  const td = tadexSegments(collectItems(FLOW), fields => fields.Key, account => tadexCategory(account, TADEX_CATEGORIES))
  const [matched, knownCount, failed] = reportPairs(matchSegments(bk, td), known)
  const stockFailed = compareStock(FLOW, initStock, combinedStock(test.endStock), {}, known)

  console.log(`${test.name}: ${matched} transactions match, ${knownCount} known differences, ${failed + stockFailed} unexplained differences.`)
  return failed + stockFailed ? 1 : 0
}

main(process.argv[2]).then(code => process.exit(code)).catch(err => {
  console.error(err)
  process.exit(2)
})
