import { describe, expect, it } from 'vitest'
import { getDriver } from '../../backend/src/driver'
import { InputDriver } from '../../backend/src/driver/InputDriver'
import { createBatchFrom } from '../lib/unit-testing'

describe('S-Pankki', () => {

  it('itemizes lines without a reference number or a message', async () => {
    const driver = getDriver('S_PANKKI', {}, { currency: 'EUR', language: 'fi' }, {}) as InputDriver
    const items = await driver.itemizeInput(createBatchFrom('SPankki.csv'))
    expect(items.map(item => [item.time, item.text, item.total])).toStrictEqual([
      ['2024-01-02T12:00:00.000Z', 'K-Market Testi', -12.5],
      ['2024-01-03T12:00:00.000Z', 'Vuokranantaja Oy', -100],
    ])
    expect(items[0].fields.Viesti).toBe('')
  })
})
