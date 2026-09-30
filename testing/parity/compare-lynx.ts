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
import path from 'path'
import { lynxItems, lynxPeriod, parseLynxRows } from '../../backend/src/lib/lynx'
import { Category, compareImport, readTest } from './parity-lib'

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

async function main(testDir: string): Promise<number> {
  const test = readTest(testDir)
  const input = path.join(test.dir, 'Lynx.csv')
  const text = fs.readFileSync(input).toString('utf-8')
  const items = lynxItems(parseLynxRows(text), lynxPeriod(text)?.start || null)

  // Instrument names are used as they are, like bookkeeper does.
  const tickers = new Set<string>()
  for (const item of items) {
    for (const field of ['Symbol', 'InSymbol', 'OutSymbol']) {
      const symbol = item.fields[field]
      if (typeof symbol === 'string' && symbol !== '') tickers.add(symbol)
    }
  }

  return compareImport(test, {
    flow: 'Lynx Testing',
    input,
    tickers: [...tickers],
    stockAccount: 'STOCK',
    statements: STATEMENTS,
    tadexCategories: TADEX_CATEGORIES,
    segmentKey: fields => fields.Key,
  })
}

main(process.argv[2]).then(code => process.exit(code)).catch(err => {
  console.error(err)
  process.exit(2)
})
