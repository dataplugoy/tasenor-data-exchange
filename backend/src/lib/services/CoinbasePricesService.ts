import { ServiceType } from '@prisma/client'
import Decimal from 'decimal.js'
import { CryptoAnswer, CryptoQuery, Service } from './Service'

/**
 * A product (trading pair) of Coinbase Exchange.
 */
export type CoinbaseProduct = {
  id: string
  base_currency: string
  quote_currency: string
  status: string
}

/**
 * A candle of Coinbase Exchange: start time in seconds, low, high, open, close and volume.
 */
export type CoinbaseCandle = [number, number, number, number, number, number]

// Granularities in seconds tried in order and how far back to look for a price with each of them.
const LOOKUPS: { granularity: number, before: number, after: number }[] = [
  { granularity: 60, before: 10 * 60, after: 60 },
  { granularity: 3600, before: 24 * 3600, after: 3600 },
  { granularity: 86400, before: 30 * 86400, after: 86400 },
]

/**
 * Historical crypto currency rates from the public market data of Coinbase Exchange. No API key is needed.
 *
 * The rate is the price of the latest trade minute at or before the time asked. Assets without a pair in the
 * currency asked are priced through BTC or through USD (using the USDC price of the currency).
 */
export class CoinbasePricesService extends Service {

  private products: Promise<CoinbaseProduct[]> | null = null
  private prices: Record<string, Promise<Decimal | null>> = {}

  getCababilities(): ServiceType[] {
    return ['CRYPTO_RATES']
  }

  protected headers(): Record<string, string> {
    return { 'Content-Type': 'application/json' }
  }

  /**
   * All products, also delisted ones, since they have prices for their trading time.
   */
  async getProducts(): Promise<CoinbaseProduct[]> {
    if (!this.products) {
      this.products = this.GET<CoinbaseProduct[]>('/products')
    }
    return this.products
  }

  async getCandles(product: string, granularity: number, start: number, end: number): Promise<CoinbaseCandle[]> {
    const iso = (t: number) => new Date(t * 1000).toISOString()
    return this.GET<CoinbaseCandle[]>(`/products/${product}/candles?granularity=${granularity}&start=${iso(start)}&end=${iso(end)}`)
  }

  /**
   * Price of a product at the given time in seconds, or null if there are no trades near the time.
   */
  async price(product: string, time: number): Promise<Decimal | null> {
    const key = `${product}:${time}`
    if (!this.prices[key]) {
      this.prices[key] = (async () => {
        for (const { granularity, before, after } of LOOKUPS) {
          const candles = await this.getCandles(product, granularity, time - before, time + after)
          const earlier = candles.filter(c => c[0] <= time).sort((a, b) => b[0] - a[0])
          if (earlier.length) {
            // Close of the latest candle started before the time.
            return new Decimal(earlier[0][4])
          }
          const later = candles.sort((a, b) => a[0] - b[0])
          if (later.length) {
            // Open of the first candle after the time.
            return new Decimal(later[0][3])
          }
        }
        return null
      })()
    }
    return this.prices[key]
  }

  async queryCryptoRates(query: CryptoQuery): Promise<CryptoAnswer | null> {
    const time = Math.floor(new Date(query.time).getTime() / 1000)
    const ids = new Set((await this.getProducts()).map(p => p.id))
    const has = (base: string, quote: string) => ids.has(`${base}-${quote}`)
    const asset = query.asset
    const currency = query.valueCurrency

    // Paths from the asset to the currency as products to multiply.
    const paths: string[][] = []
    if (has(asset, currency)) paths.push([`${asset}-${currency}`])
    if (asset !== 'BTC' && has(asset, 'BTC') && has('BTC', currency)) paths.push([`${asset}-BTC`, `BTC-${currency}`])
    if (has(asset, 'USD') && has('USDC', currency)) paths.push([`${asset}-USD`, `USDC-${currency}`])

    for (const path of paths) {
      let value = new Decimal(1)
      for (const product of path) {
        const price = await this.price(product, time)
        if (price === null) {
          value = new Decimal(NaN)
          break
        }
        value = value.mul(price)
      }
      if (value.isFinite()) {
        return { value }
      }
    }

    return null
  }
}
