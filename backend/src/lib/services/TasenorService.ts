import { ServiceType } from '@prisma/client'
import { CryptoAnswer, CryptoQuery, CurrencyAnswer, CurrencyQuery, Service } from './Service'
import { Token } from '@tasenor/common'
import Decimal from 'decimal.js'

export class TasenorService extends Service {

  getCababilities(): ServiceType[] {
    return ['CURRENCY_RATES', 'CRYPTO_RATES']
  }

  private async callService<T>(service: string, data: Record<string, string | number>): Promise<T> {
    if (!this.settings.token) {
      const resp: { token: Token } = await this.POST('/auth', { user: this.settings.user, password: this.settings.password })
      this.settings.token = resp.token
    }

    const args: string[] = []
    Object.keys(data).forEach(key => {
      args.push(`${key}=${encodeURIComponent(data[key])}`)
    })

    const res = await this.GET<T>(`/services/${service}?${args.join('&')}&token=${this.settings.token}`)
    return res
  }

  async queryCryptoRates(query: CryptoQuery): Promise<CryptoAnswer> {

    const data ={ from: query.asset, to: query.valueCurrency, date: query.time.substring(0, 10) }

    const res = await this.callService<{ rate: number }>('historical-crypto-rate', data)
    return {
      value: new Decimal(res.rate)
    }
  }

  async queryCurrencyRates(query: CurrencyQuery): Promise<CurrencyAnswer | null> {

    const data ={ from: query.currency, to: query.valueCurrency, date: query.time.substring(0, 10) }

    const res = await this.callService<{ rate: number }>('historical-currency-rate', data)
    return {
      value: new Decimal(res.rate)
    }
  }

}
