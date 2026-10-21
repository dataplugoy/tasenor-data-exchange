import { ServiceType } from '@prisma/client'
import Decimal from 'decimal.js'
import { DateTime } from 'luxon'
import { AxiosError } from 'axios'
import { CurrencyAnswer, CurrencyQuery, Service } from './Service'

/**
 * Rates of a currency by date: how many units of the currency one euro is.
 */
export type EcbRates = Record<string, Decimal>

// How many days back to look for a rate, since there are none for weekends and holidays.
const MAX_DAYS_BACK = 10

/**
 * Euro foreign exchange reference rates of the European Central Bank. No API key is needed.
 *
 * The rates are published on working days around 16:00 CET. For other days the rate of the latest earlier working
 * day is used. Rates between two other currencies than euro are cross rates through euro.
 */
export class EcbRatesService extends Service {

  private rates: Record<string, Promise<EcbRates>> = {}

  getCababilities(): ServiceType[] {
    return ['CURRENCY_RATES']
  }

  protected headers(): Record<string, string> {
    return { Accept: 'text/csv' }
  }

  /**
   * Fetch the daily rates of a currency between two dates as CSV.
   */
  async fetchCsv(currency: string, start: string, end: string): Promise<string> {
    return this.GET<string>(`/service/data/EXR/D.${currency}.EUR.SP00.A?startPeriod=${start}&endPeriod=${end}&format=csvdata`)
  }

  /**
   * The rates of a currency for a year and the days before it needed for its first days.
   */
  async getRates(currency: string, year: number): Promise<EcbRates> {
    const key = `${currency}:${year}`
    if (!this.rates[key]) {
      this.rates[key] = (async () => {
        const start = DateTime.fromISO(`${year}-01-01`).minus({ days: MAX_DAYS_BACK }).toISODate() as string
        let csv: string
        try {
          csv = await this.fetchCsv(currency, start, `${year}-12-31`)
        } catch (err) {
          // Currencies without rates are not found.
          if ((err as AxiosError).response?.status === 404) {
            return {}
          }
          delete this.rates[key]
          throw err
        }
        return parseEcbCsv(csv)
      })()
    }
    return this.rates[key]
  }

  /**
   * How many units of the currency one euro is on the date or on the latest earlier day having a rate.
   */
  async perEuro(currency: string, date: string): Promise<Decimal | null> {
    if (currency === 'EUR') {
      return new Decimal(1)
    }
    const rates = await this.getRates(currency, parseInt(date.substring(0, 4)))
    let day = DateTime.fromISO(date)
    for (let i = 0; i <= MAX_DAYS_BACK; i++) {
      const rate = rates[day.toISODate() as string]
      if (rate) {
        return rate
      }
      day = day.minus({ days: 1 })
    }
    return null
  }

  async queryCurrencyRates(query: CurrencyQuery): Promise<CurrencyAnswer | null> {
    const date = query.time.substring(0, 10)
    const currency = await this.perEuro(query.currency, date)
    const valueCurrency = await this.perEuro(query.valueCurrency, date)
    if (!currency || !valueCurrency) {
      return null
    }
    return { value: valueCurrency.div(currency) }
  }
}

/**
 * Parse the CSV of the ECB data API to rates by date.
 */
export function parseEcbCsv(csv: string): EcbRates {
  if (csv.trim() === '') {
    return {}
  }
  const lines = csv.trim().split(/\r?\n/)
  const header = lines[0].split(',')
  const date = header.indexOf('TIME_PERIOD')
  const value = header.indexOf('OBS_VALUE')
  if (date < 0 || value < 0) {
    throw new Error('Unexpected CSV from the ECB data API.')
  }
  const rates: EcbRates = {}
  for (const line of lines.slice(1)) {
    const fields = line.split(',')
    if (fields[value]) {
      rates[fields[date]] = new Decimal(fields[value])
    }
  }
  return rates
}
