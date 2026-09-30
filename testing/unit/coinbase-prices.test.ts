import { describe, expect, test } from 'vitest'
import { CryptoCurrency, Currency, Timestring } from '@tasenor/common'
import { CoinbaseCandle, CoinbaseProduct, CoinbasePricesService } from '../../backend/src/lib/services/CoinbasePricesService'
import { Service } from '../../backend/src/lib/services/Service'
import { Analyzer } from '../../backend/src/lib/analyzer/Analyzer'
import { Stock } from '../../backend/src/lib/Stock'

const T = Date.parse('2024-03-07T19:32:35Z') / 1000

/**
 * Coinbase prices without network: products and one-minute candles given in the test.
 */
class StubPrices extends CoinbasePricesService {
  requests: string[] = []

  constructor(private readonly products: string[], private readonly candles: Record<string, CoinbaseCandle[]>) {
    super({ url: 'https://api.exchange.coinbase.com' })
  }

  async getProducts(): Promise<CoinbaseProduct[]> {
    return this.products.map(id => ({ id, base_currency: id.split('-')[0], quote_currency: id.split('-')[1], status: 'online' }))
  }

  async getCandles(product: string, granularity: number, start: number, end: number): Promise<CoinbaseCandle[]> {
    this.requests.push(`${product}:${granularity}`)
    return (this.candles[`${product}:${granularity}`] || []).filter(c => c[0] >= start && c[0] <= end)
  }
}

const query = (asset: string) => ({ query: 'CRYPTO_RATES' as const, time: '2024-03-07T19:32:35.000Z' as Timestring, asset: asset as CryptoCurrency, valueCurrency: 'EUR' as Currency })

describe('Coinbase prices', () => {

  test('direct pair uses the latest minute before the time', async () => {
    const s = new StubPrices(['GRT-EUR'], {
      'GRT-EUR:60': [[T - 120, 0, 0, 0.1, 0.11, 1], [T - 60, 0, 0, 0.11, 0.12, 1], [T + 30, 0, 0, 0.5, 0.6, 1]],
    })
    expect((await s.queryCryptoRates(query('GRT')))?.value.toString()).toBe('0.12')
  })

  test('illiquid pair falls back to hourly prices', async () => {
    const s = new StubPrices(['GRT-EUR'], {
      'GRT-EUR:3600': [[T - 3600, 0, 0, 0.2, 0.25, 1]],
    })
    expect((await s.queryCryptoRates(query('GRT')))?.value.toString()).toBe('0.25')
    expect(s.requests).toStrictEqual(['GRT-EUR:60', 'GRT-EUR:3600'])
  })

  test('assets without a pair in the currency are priced through BTC or USD', async () => {
    const s = new StubPrices(['ETH-BTC', 'BTC-EUR', 'NEAR-USD', 'USDC-EUR'], {
      'ETH-BTC:60': [[T - 30, 0, 0, 0, 0.05, 1]],
      'BTC-EUR:60': [[T - 30, 0, 0, 0, 60000, 1]],
      'NEAR-USD:60': [[T - 30, 0, 0, 0, 5.5, 1]],
      'USDC-EUR:60': [[T - 30, 0, 0, 0, 0.92, 1]],
    })
    expect((await s.queryCryptoRates(query('ETH')))?.value.toString()).toBe('3000')
    expect((await s.queryCryptoRates(query('NEAR')))?.value.toString()).toBe('5.06')
  })

  test('unknown asset has no answer', async () => {
    const s = new StubPrices(['BTC-EUR'], {})
    expect(await s.queryCryptoRates(query('BSV'))).toBe(null)
  })

  test('analyzer asks the next service when one fails', async () => {
    class Failing extends Service {
      getCababilities() { return ['CRYPTO_RATES' as const] }
      async queryCryptoRates(): Promise<null> { throw new Error('Request failed with status code 403') }
    }
    const prices = new StubPrices(['BTC-EUR'], { 'BTC-EUR:60': [[T - 30, 0, 0, 0, 60000, 1]] })
    const analyzer = new Analyzer({ currency: 'EUR', language: 'en' }, new Stock({}), {})
    analyzer.setServices([new Failing({ url: '' }), prices])
    expect((await analyzer.askService(query('BTC'))).value.toString()).toBe('60000')

    analyzer.setServices([new Failing({ url: '' })])
    await expect(analyzer.askService(query('BTC'))).rejects.toThrow('Failing: Request failed with status code 403')
  })
})
