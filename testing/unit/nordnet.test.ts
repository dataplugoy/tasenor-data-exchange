import { describe, expect, test } from 'vitest'
import { getDriver } from '../../backend/src/driver'
import { createBatchFrom, unifyItems } from '../lib/unit-testing'
import { Stock } from '../../backend/src/lib/Stock'
import { Analyzer } from '../../backend/src/lib/analyzer/Analyzer'
import { Transaction } from '../../backend/src/types/API/Transaction'
import { DateTime } from 'luxon'

describe('Nordnet', () => {

  test('deposit, buying, fee', async () => {

    const driver = getDriver('NORDNET', {})
    const batch = createBatchFrom('Nordnet-deposit-buy-fee.csv')

    const items = await driver.itemizeInput(batch)
    expect(items.length).toBe(6)

    const unifieds = await unifyItems(driver, items)
    expect(unifieds.length).toBe(6)

    // TODO: Move to unit-testing.ts once ready.
    const stock = new Stock({})
    const analyzer = new Analyzer(stock)
    Analyzer.configure({
      currency: 'EUR',
      language: 'en'
    })

    // for (const unified of unifieds) {
    //   const tx: Transaction = await analyzer.analyze(DateTime.fromJSDate(unified.data.time).toUTC(), unified.input)
    //   console.log(tx)
    // }

    expect(null).toBe(null)
  })
})
