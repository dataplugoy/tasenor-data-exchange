/**
 * Compare TaDeX results against the expected results of a Tasenor Bookkeeper Coinbase import test.
 *
 * Usage: npx tsx testing/parity/compare-coinbase.ts <path to bookkeeper import test directory>
 *
 * The bookkeeper test directory (e.g. tasenor-qa/tests/import/Dataplug-2024-Coinbase) contains the export
 * `Coinbase.csv`, initial `stock.json` and `balance.json`, `settings.json` for account mapping, crypto rates
 * `rates.json` for trades without values and the expected `transactions.json` and `end-stock.json`.
 *
 * NOTE: This resets the development database and changes the rate service of the test user.
 */
import fs from 'fs'
import path from 'path'
import { coinbaseItems } from '../../backend/src/lib/coinbase'
import { Category, compareImport, readTest } from './parity-lib'

const STATEMENTS: Record<string, Category> = {
  TRADE_PROFIT_CRYPTO: 'PROFIT',
  TRADE_LOSS_CRYPTO: 'LOSS',
  LEARNING_REWARDS: 'REWARD',
  CRYPTO_BROKER_SERVICE_FEE: 'FEE',
  NEEDS_MANUAL_INSPECTION: 'EXTERNAL',
  NEEDS_MANUAL_INSPECTION_IN: 'EXTERNAL',
}

const TADEX_CATEGORIES: Record<string, Category> = {
  CRYPTO: 'STOCK',
}

async function main(testDir: string): Promise<number> {
  const test = readTest(testDir)
  const input = path.join(test.dir, 'Coinbase.csv')
  const items = coinbaseItems(fs.readFileSync(input).toString('utf-8'))

  const tickers = new Set<string>()
  for (const item of items) {
    for (const field of ['Asset', 'GiveAsset', 'GetAsset']) {
      const asset = item.fields[field]
      if (typeof asset === 'string' && asset !== '') tickers.add(asset)
    }
  }

  // Bookkeeper settings map some stock accounts to the account of manual inspection, which is not a stock account.
  const external = new Set(Object.entries(test.settings).filter(([k]) => /\.external\./.test(k)).map(([, v]) => v))
  test.settings = Object.fromEntries(Object.entries(test.settings).filter(([k, v]) => !(/^account\.\w+\.(stock|short)\./.test(k) && external.has(v))))

  return compareImport(test, {
    flow: 'Coinbase Testing',
    input,
    tickers: [...tickers],
    stockAccount: 'CRYPTO',
    statements: STATEMENTS,
    tadexCategories: TADEX_CATEGORIES,
    // Bookkeeper uses trade and transfer IDs of v1 as segment IDs.
    segmentKey: fields => fields.Id.replace(/^(trade|transfer):/, ''),
    grouping: { singleCryptoAccount: true },
    settings: {
      skipDeposits: !test.settings.recordDeposits,
      skipWithdrawals: !test.settings.recordWithdrawals,
    },
  })
}

main(process.argv[2]).then(code => process.exit(code)).catch(err => {
  console.error(err)
  process.exit(2)
})
