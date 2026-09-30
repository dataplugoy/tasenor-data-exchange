import { describe, expect, test } from 'vitest'
import { TasenorService } from '../../backend/src/lib/services/TasenorService'
import { CryptoCurrency, Currency, Timestring } from '@tasenor/common'

class RecordingService extends TasenorService {
  calls: [string, Record<string, string | number>][] = []

  protected async callService<T>(service: string, data: Record<string, string | number>): Promise<T> {
    this.calls.push([service, data])
    return { rate: 1.5 } as T
  }
}

describe('Tasenor service', () => {

  test('crypto rates are asked at the time of the transaction', async () => {
    const service = new RecordingService({ url: 'http://localhost' })
    const answer = await service.queryCryptoRates({ query: 'CRYPTO_RATES', time: '2025-08-20T20:43:44.000+02:00' as Timestring, asset: 'BTC' as CryptoCurrency, valueCurrency: 'EUR' as Currency })
    expect(answer.value.toNumber()).toBe(1.5)
    expect(service.calls).toStrictEqual([['historical-crypto-rate', { from: 'BTC', to: 'EUR', date: '2025-08-20T18:43:44.000Z' }]])
  })

  test('currency rates are daily', async () => {
    const service = new RecordingService({ url: 'http://localhost' })
    await service.queryCurrencyRates({ query: 'CURRENCY_RATES', time: '2025-08-20T18:43:44.000Z' as Timestring, currency: 'USD' as Currency, valueCurrency: 'EUR' as Currency })
    expect(service.calls).toStrictEqual([['historical-currency-rate', { from: 'USD', to: 'EUR', date: '2025-08-20' }]])
  })
})
