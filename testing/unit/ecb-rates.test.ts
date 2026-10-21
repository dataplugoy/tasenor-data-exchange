import { describe, expect, test } from 'vitest'
import { Currency, Timestring } from '@tasenor/common'
import { EcbRatesService, parseEcbCsv } from '../../backend/src/lib/services/EcbRatesService'

const HEADER = 'KEY,FREQ,CURRENCY,CURRENCY_DENOM,EXR_TYPE,EXR_SUFFIX,TIME_PERIOD,OBS_VALUE,OBS_STATUS,OBS_CONF,OBS_PRE_BREAK,OBS_COM'

const csv = (currency: string, rates: Record<string, string>) => [
  HEADER,
  ...Object.entries(rates).map(([date, value]) => `EXR.D.${currency}.EUR.SP00.A,D,${currency},EUR,SP00,A,${date},${value},A,F,,`)
].join('\r\n')

/**
 * ECB rates without network: CSV of each currency given in the test.
 */
class StubRates extends EcbRatesService {
  requests: string[] = []

  constructor(private readonly data: Record<string, Record<string, string>>) {
    super({ url: 'https://data-api.ecb.europa.eu' })
  }

  async fetchCsv(currency: string, start: string, end: string): Promise<string> {
    this.requests.push(`${currency}:${start}:${end}`)
    if (!this.data[currency]) {
      throw Object.assign(new Error('Request failed with status code 404'), { response: { status: 404 } })
    }
    return csv(currency, Object.fromEntries(Object.entries(this.data[currency]).filter(([date]) => date >= start && date <= end)))
  }
}

const query = (currency: string, valueCurrency: string, time: string) => ({
  query: 'CURRENCY_RATES' as const,
  time: time as Timestring,
  currency: currency as Currency,
  valueCurrency: valueCurrency as Currency,
})

const rate = async (s: EcbRatesService, currency: string, valueCurrency: string, time: string) =>
  (await s.queryCurrencyRates(query(currency, valueCurrency, time)))?.value.toDecimalPlaces(6).toString()

describe('ECB rates', () => {

  test('CSV is parsed by its header', () => {
    expect(parseEcbCsv(csv('USD', { '2024-01-04': '1.0953', '2024-01-05': '1.0921' }))).toStrictEqual({
      '2024-01-04': expect.anything(),
      '2024-01-05': expect.anything(),
    })
    expect(parseEcbCsv(csv('USD', { '2024-01-05': '1.0921' }))['2024-01-05'].toString()).toBe('1.0921')
    expect(parseEcbCsv('')).toStrictEqual({})
    expect(() => parseEcbCsv('A,B\n1,2')).toThrow()
  })

  test('value of a currency in euro', async () => {
    const s = new StubRates({ USD: { '2024-01-05': '1.0921', '2024-01-08': '1.0946' } })
    expect(await rate(s, 'USD', 'EUR', '2024-01-08T12:00:00.000Z')).toBe('0.913576')
    expect(await rate(s, 'EUR', 'USD', '2024-01-08T12:00:00.000Z')).toBe('1.0946')
    expect(await rate(s, 'EUR', 'EUR', '2024-01-08T12:00:00.000Z')).toBe('1')
  })

  test('weekends and holidays use the latest earlier rate', async () => {
    const s = new StubRates({ USD: { '2024-01-05': '1.0921', '2024-01-08': '1.0946' } })
    expect(await rate(s, 'EUR', 'USD', '2024-01-06T12:00:00.000Z')).toBe('1.0921')
    expect(await rate(s, 'EUR', 'USD', '2024-01-07T23:59:59.000Z')).toBe('1.0921')
  })

  test('first days of the year use the rates of the previous year', async () => {
    const s = new StubRates({ USD: { '2023-12-29': '1.105', '2024-01-02': '1.0956' } })
    expect(await rate(s, 'EUR', 'USD', '2024-01-01T12:00:00.000Z')).toBe('1.105')
    expect(s.requests).toStrictEqual(['USD:2023-12-22:2024-12-31'])
  })

  test('no rate when there is none within ten days', async () => {
    const s = new StubRates({ USD: { '2024-01-05': '1.0921' } })
    expect(await s.queryCurrencyRates(query('USD', 'EUR', '2024-01-16T12:00:00.000Z'))).toBe(null)
  })

  test('cross rates go through euro', async () => {
    const s = new StubRates({ USD: { '2024-01-08': '1.0946' }, SEK: { '2024-01-08': '11.1' } })
    // 1 USD = 11.1 / 1.0946 SEK.
    expect(await rate(s, 'USD', 'SEK', '2024-01-08T12:00:00.000Z')).toBe('10.140691')
  })

  test('currencies without rates', async () => {
    const s = new StubRates({})
    expect(await s.queryCurrencyRates(query('ARS', 'EUR', '2024-01-08T12:00:00.000Z'))).toBe(null)
  })

  test('rates are fetched once per currency and year', async () => {
    const s = new StubRates({ USD: { '2024-01-05': '1.0921', '2024-01-08': '1.0946' } })
    await rate(s, 'USD', 'EUR', '2024-01-05T12:00:00.000Z')
    await rate(s, 'USD', 'EUR', '2024-01-08T12:00:00.000Z')
    await rate(s, 'USD', 'EUR', '2023-06-01T12:00:00.000Z')
    expect(s.requests).toStrictEqual(['USD:2023-12-22:2024-12-31', 'USD:2022-12-22:2023-12-31'])
  })

  test('only currency rates are provided', () => {
    expect(new StubRates({}).getCababilities()).toStrictEqual(['CURRENCY_RATES'])
  })
})
