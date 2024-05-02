import { describe, expect, test } from 'vitest'
import { getDriver } from '../../backend/src/driver'
import { createBatchFrom, unifyFrom } from '../lib/unit-testing'

describe.only('Nordnet', () => {
  test('deposit, buying, fee', async () => {
    const driver = getDriver('NORDNET', {})
    const batch = createBatchFrom('Nordnet-deposit-buy-fee.csv')

    const items = await driver.itemizeInput(batch)

    const [flowPlan, run, inputItems, rules] = unifyFrom(items)
    for (const input of inputItems) {
      const item = await driver.unifyItem(flowPlan, run, input, rules)
      console.log(item)
    }

    expect(null).toBe(null)
  })
})
