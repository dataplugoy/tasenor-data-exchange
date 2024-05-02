import { describe, expect, test } from 'vitest'
import { getDriver } from '../../backend/src/driver'
import { createBatchFrom, unifyItems } from '../lib/unit-testing'

describe.only('Nordnet', () => {
  test('deposit, buying, fee', async () => {
    const driver = getDriver('NORDNET', {})
    const batch = createBatchFrom('Nordnet-deposit-buy-fee.csv')

    const items = await driver.itemizeInput(batch)
    expect(items.length).toBe(6)

    const unified = await unifyItems(driver, items)
    expect(unified.length).toBe(6)

    expect(null).toBe(null)
  })
})
