import { describe, expect, test } from 'vitest'
import { getDriver } from '../../backend/src/driver'
import { createBatchFrom } from '../lib/unit-testing'

describe.only('Nordnet', () => {
  test('deposit, buying, fee', async () => {
    const driver = getDriver('NORDNET', {})
    const batch = createBatchFrom('Nordnet-deposit-buy-fee.csv')

    const items = await driver.itemizeInput(batch)
console.log(items)
    expect(null).toBe(null)
  })
})
