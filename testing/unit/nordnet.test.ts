import { describe, expect, test } from 'vitest'
import { getDriver } from '../../backend/src/driver'
import { analyzeItems, createBatchFrom, unifyItems } from '../lib/unit-testing'
import { InputDriver } from '../../backend/src/driver/InputDriver'

describe('Nordnet', () => {

  const projectSettings = { currency: 'EUR', language: 'en' }

  test('deposit, buying, fee', async () => {

    const driver = getDriver('NORDNET', {}, projectSettings, {}) as InputDriver as InputDriver
    const batch = createBatchFrom('Nordnet-deposit-buy-fee.csv')

    const items = await driver.itemizeInput(batch)
    expect(items.length).toBe(6)

    const unifieds = await unifyItems(driver, items)
    expect(unifieds.length).toBe(6)

    const txs = await analyzeItems(unifieds, projectSettings)

    expect(txs).toStrictEqual([
      {
        time: '2024-04-03T12:00:00.000Z',
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '800',
            text: 'Deposit to Nordnet',
            extras: {}
          },
          {
            account: 'EXTERNAL_NORDNET_EUR',
            amount: '-800',
            text: 'Deposit to Nordnet',
            extras: {}
          }
        ]
      },
      {
        time: '2024-04-05T12:00:00.000Z',
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '-140.73',
            text: 'Bought +38 RIZF',
            extras: {}
          },
          {
            account: 'STOCK_RIZF',
            amount: '140.73',
            text: 'Bought +38 RIZF',
            extras: { asset: 'RIZF', assetChange: '38' }
          }
        ]
      },
      {
        time: '2024-04-05T12:00:00.000Z',
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '-91.63',
            text: 'Bought +3 WTEJ',
            extras: {}
          },
          {
            account: 'STOCK_WTEJ',
            amount: '91.63',
            text: 'Bought +3 WTEJ',
            extras: { asset: 'WTEJ', assetChange: '3' }
          }
        ]
      },
      {
        time: '2024-04-05T12:00:00.000Z',
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '-236.16',
            text: 'Bought +8 W1TA',
            extras: {}
          },
          {
            account: 'STOCK_W1TA',
            amount: '236.16',
            text: 'Bought +8 W1TA',
            extras: { asset: 'W1TA', assetChange: '8' }
          }
        ]
      },
      {
        time: '2024-04-05T12:00:00.000Z',
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '-316.14',
            text: 'Bought +43 IQQH',
            extras: {}
          },
          {
            account: 'STOCK_IQQH',
            amount: '316.14',
            text: 'Bought +43 IQQH',
            extras: { asset: 'IQQH', assetChange: '43' }
          }
        ]
      },
      {
        time: '2024-04-30T12:00:00.000Z',
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '-2.5',
            text: 'Monthly fee',
            extras: {}
          },
          {
            account: 'EXPENSE_MONTHLY_FEE',
            amount: '2.5',
            text: 'Monthly fee',
            extras: {}
          }
        ]
      },
    ])

  })

  test('sell', async () => {

    const driver = getDriver('NORDNET', {}, projectSettings, {}) as InputDriver
    const batch = createBatchFrom('Nordnet-sell.csv')

    const items = await driver.itemizeInput(batch)
    expect(items.length).toBe(3)

    const unifieds = await unifyItems(driver, items)
    expect(unifieds.length).toBe(3)

    const txs = await analyzeItems(unifieds, projectSettings)

    expect(txs).toStrictEqual([
      {
        time: '2023-10-02T12:00:00.000Z',
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '-3607',
            text: 'Bought +1000 MANTA',
            extras: {}
          },
          {
            account: 'STOCK_MANTA',
            amount: '3600',
            text: 'Bought +1000 MANTA',
            extras: { asset: 'MANTA', assetChange: '1000' }
          },
          {
            account: 'FEE_EUR',
            amount: '7',
            text: 'Bought +1000 MANTA',
            extras: {}
          }
        ]
      },
      {
        time: '2024-01-25T12:00:00.000Z',
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '747.2',
            text: 'Sold -177 MANTA',
            extras: {}
          },
          {
            account: 'STOCK_MANTA',
            amount: '-637.2',
            text: 'Sold -177 MANTA',
            extras: { asset: 'MANTA', assetChange: '-177' }
          },
          {
            account: 'PROFIT_MANTA',
            amount: '-117',
            text: 'Sold -177 MANTA',
            extras: {}
          },
          {
            account: 'FEE_EUR',
            amount: '7',
            text: 'Sold -177 MANTA',
            extras: {}
          }
        ]
      },
      {
        time: '2024-04-10T12:00:00.000Z',
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '3554.12',
            text: 'Sold -823 MANTA',
            extras: {}
          },
          {
            account: 'STOCK_MANTA',
            amount: '-2962.8',
            text: 'Sold -823 MANTA',
            extras: { asset: 'MANTA', assetChange: '-823' }
          },
          {
            account: 'PROFIT_MANTA',
            amount: '-598.32',
            text: 'Sold -823 MANTA',
            extras: {}
          },
          {
            account: 'FEE_EUR',
            amount: '7',
            text: 'Sold -823 MANTA',
            extras: {}
          }
        ]
      }
    ]
    )
  })

  test('dividend', async () => {

    const driver = getDriver('NORDNET', {}, projectSettings, {}) as InputDriver
    const batch = createBatchFrom('Nordnet-dividend.csv')

    const items = await driver.itemizeInput(batch)
    expect(items.length).toBe(4)

    const unifieds = await unifyItems(driver, items)
    expect(unifieds.length).toBe(4)

    const txs = await analyzeItems(unifieds, projectSettings)

    expect(txs).toStrictEqual(
      [
        {
          time: '2023-05-31T12:00:00.000Z',
          lines: [
            {
              account: 'CURRENCY_USD',
              amount: '8.712298',
              text: 'Dividend for IQQQ',
              extras: {}
            },
            {
              account: 'INCOME_DIVIDEND',
              amount: '-8.712298',
              text: 'Dividend for IQQQ',
              extras: {}
            }
          ]
        },
        {
          time: '2023-05-31T12:00:00.000Z',
          lines: [
            {
              account: 'CURRENCY_USD',
              amount: '9.152124',
              text: 'Dividend for IQQH',
              extras: {}
            },
            {
              account: 'INCOME_DIVIDEND',
              amount: '-9.152124',
              text: 'Dividend for IQQH',
              extras: {}
            }
          ]
        },
        {
          time: '2023-11-30T12:00:00.000Z',
          lines: [
            {
              account: 'CURRENCY_USD',
              amount: '17.288052',
              text: 'Dividend for IQQQ',
              extras: {}
            },
            {
              account: 'INCOME_DIVIDEND',
              amount: '-17.288052',
              text: 'Dividend for IQQQ',
              extras: {}
            }
          ]
        },
        {
          time: '2023-11-30T12:00:00.000Z',
          lines: [
            {
              account: 'CURRENCY_USD',
              amount: '19.832574',
              text: 'Dividend for IQQH',
              extras: {}
            },
            {
              account: 'INCOME_DIVIDEND',
              amount: '-19.832574',
              text: 'Dividend for IQQH',
              extras: {}
            }
          ]
        }
      ]
    )
  })

  test('withdrawal', async () => {

    const driver = getDriver('NORDNET', {}, projectSettings, {}) as InputDriver
    const batch = createBatchFrom('Nordnet-withdrawal.csv')

    const items = await driver.itemizeInput(batch)
    expect(items.length).toBe(1)

    const unifieds = await unifyItems(driver, items)
    expect(unifieds.length).toBe(1)

    const txs = await analyzeItems(unifieds, projectSettings)

    expect(txs).toStrictEqual([
      {
        time: '2023-05-09T12:00:00.000Z',
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '-1930',
            text: 'Withdrawal from Nordnet',
            extras: {}
          },
          {
            account: 'EXTERNAL_NORDNET_EUR',
            amount: '1930',
            text: 'Withdrawal from Nordnet',
            extras: {}
          }
        ]
      }
    ])
  })

  test('interest', async () => {

    const driver = getDriver('NORDNET', {}, projectSettings, {}) as InputDriver
    const batch = createBatchFrom('Nordnet-interest.csv')

    const items = await driver.itemizeInput(batch)
    expect(items.length).toBe(2)

    const unifieds = await unifyItems(driver, items)
    expect(unifieds.length).toBe(2)

    const txs = await analyzeItems(unifieds, projectSettings)

    expect(txs).toStrictEqual([
      {
        time: '2023-05-31T12:00:00.000Z',
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '-0.74',
            text: 'Interest expense',
            extras: {}
          },
          {
            account: 'EXPENSE_INTEREST',
            amount: '0.74',
            text: 'Interest expense',
            extras: {}
          }
        ]
      },
      {
        time: '2023-05-31T12:00:00.000Z',
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '-0.52',
            text: 'Interest expense',
            extras: {}
          },
          {
            account: 'EXPENSE_INTEREST',
            amount: '0.52',
            text: 'Interest expense',
            extras: {}
          }
        ]
      }
    ]
    )
  })

  test('forex', async () => {

    const driver = getDriver('NORDNET', {}, projectSettings, {}) as InputDriver
    const batch = createBatchFrom('Nordnet-forex.csv')

    const items = await driver.itemizeInput(batch)
    expect(items.length).toBe(4)

    const unifieds = await unifyItems(driver, items)
    expect(unifieds.length).toBe(2)

    const txs = await analyzeItems(unifieds, projectSettings)
    expect(txs).toStrictEqual([
      {
        time: '2023-06-05T12:00:00.000Z',
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '17.83',
            text: 'Sold 19.09 USD in exhcange to EUR',
            extras: {}
          },
          {
            account: 'CURRENCY_USD',
            amount: '-17.83',
            text: 'Sold 19.09 USD in exhcange to EUR',
            extras: {}
          }
        ]
      },
      {
        time: '2024-02-07T12:00:00.000Z',
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '37.52',
            text: 'Sold 40.41 USD in exhcange to EUR',
            extras: {}
          },
          {
            account: 'CURRENCY_USD',
            amount: '-37.52',
            text: 'Sold 40.41 USD in exhcange to EUR',
            extras: {}
          }
        ]
      }
    ])
  })

  test('forex 2', async () => {

    const driver = getDriver('NORDNET', {}, projectSettings, {}) as InputDriver
    const batch = createBatchFrom('Nordnet-forex2.csv')

    const items = await driver.itemizeInput(batch)
    expect(items.length).toBe(4)

    const unifieds = await unifyItems(driver, items)
    expect(unifieds.length).toBe(2)

    const txs = await analyzeItems(unifieds, projectSettings)

    expect(txs).toStrictEqual([
      {
        time: '2022-08-09T12:00:00.000Z',
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '-1973.14',
            text: 'Bought 2013.06 USD in exhcange to EUR',
            extras: {}
          },
          {
            account: 'CURRENCY_USD',
            amount: '1973.14',
            text: 'Bought 2013.06 USD in exhcange to EUR',
            extras: {}
          }
        ]
      },
      {
        time: '2022-08-10T12:00:00.000Z',
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '-15',
            text: 'Bought 15.33 USD in exhcange to EUR',
            extras: {}
          },
          {
            account: 'CURRENCY_USD',
            amount: '15',
            text: 'Bought 15.33 USD in exhcange to EUR',
            extras: {}
          }
        ]
      }
    ])
  })

  test('rename instrument', async () => {

    const driver = getDriver('NORDNET', {}, projectSettings, {}) as InputDriver
    const batch = createBatchFrom('Nordnet-rename.csv')

    const items = await driver.itemizeInput(batch)
    expect(items.length).toBe(2)

    const unifieds = await unifyItems(driver, items)
    expect(unifieds.length).toBe(1)

    const txs = await analyzeItems(unifieds, projectSettings)

    expect(txs).toStrictEqual([
      {
        time: '2018-10-01T12:00:00.000Z',
        lines: [
          {
            account: 'STOCK_NDA1V',
            amount: '-5003.39',
            text: 'Renamed +549 NDA1V to NDA FI',
            extras: { asset: 'NDA1V', assetChange: '-549' }
          },
          {
            account: 'STOCK_NDA_FI',
            amount: '5003.39',
            text: 'Renamed +549 NDA1V to NDA FI',
            extras: { asset: 'NDA FI', assetChange: '549' }
          }
        ]
      }
    ])
  })

  test('split', async () => {

    const driver = getDriver('NORDNET', {}, projectSettings, {}) as InputDriver
    const batch = createBatchFrom('Nordnet-split.csv')

    const items = await driver.itemizeInput(batch)
    expect(items.length).toBe(2)

    const unifieds = await unifyItems(driver, items)
    expect(unifieds.length).toBe(1)

    const txs = await analyzeItems(unifieds, projectSettings)

    expect(txs).toStrictEqual([
      {
        time: '2019-03-18T12:00:00.000Z',
        lines: [
          {
            account: 'STOCK_CTY1S',
            amount: '-5520.06',
            text: 'Split CTY1S (converted 3135 to 627)',
            extras: { asset: 'CTY1S', assetChange: '-3135' }
          },
          {
            account: 'STOCK_CTY1S',
            amount: '5520.06',
            text: 'Split CTY1S (converted 3135 to 627)',
            extras: { asset: 'CTY1S', assetChange: '627' }
          }
        ]
      }
    ])
  })

  test('withholding tax', async () => {

    const driver = getDriver('NORDNET', {}, projectSettings, {}) as InputDriver
    const batch = createBatchFrom('Nordnet-withholding-tax.csv')

    const items = await driver.itemizeInput(batch)
    expect(items.length).toBe(2)

    const unifieds = await unifyItems(driver, items)
    expect(unifieds.length).toBe(1)

    const txs = await analyzeItems(unifieds, projectSettings)

    expect(txs).toStrictEqual([
      {
        time: '2020-04-09T12:00:00.000Z',
        lines: [
          {
            account: 'CURRENCY_SEK',
            amount: '124.614',
            text: 'Dividend for TELIA1',
            extras: {}
          },
          {
            account: 'INCOME_DIVIDEND',
            amount: '-105.92236',
            text: 'Dividend for TELIA1',
            extras: {}
          },
          {
            account: 'TAX_WITHHOLDING',
            amount: '-18.69164',
            text: 'Dividend for TELIA1',
            extras: {}
          }
        ]
      }
    ])
  })

  test('interest correction', async () => {

    const driver = getDriver('NORDNET', {}, projectSettings, {}) as InputDriver
    const batch = createBatchFrom('Nordnet-interest-correction.csv')

    const items = await driver.itemizeInput(batch)
    expect(items.length).toBe(1)

    const unifieds = await unifyItems(driver, items)
    expect(unifieds.length).toBe(1)

    const txs = await analyzeItems(unifieds, projectSettings)

    expect(txs).toStrictEqual([
      {
        time: '2019-07-01T12:00:00.000Z',
        lines: [
          {
            account: 'CURRENCY_EUR',
            amount: '0.01',
            text: 'Interest expense refund',
            extras: {}
          },
          {
            account: 'EXPENSE_INTEREST',
            amount: '-0.01',
            text: 'Interest expense refund',
            extras: {}
          }
        ]
      }
    ])
  })
})
