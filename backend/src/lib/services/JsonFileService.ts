import { ServiceType } from '@prisma/client'
import { CryptoAnswer, CryptoQuery, CurrencyAnswer, CurrencyQuery, Service } from './Service'
import path from 'path'
import fs from 'fs'
import Decimal from 'decimal.js'

export class JsonFileService extends Service {

  getCababilities(): ServiceType[] {
    return ['CURRENCY_RATES', 'CRYPTO_RATES']
  }

  private getFile(): any {
    const url = new URL(this.settings.url)
    if (url.protocol !== 'file:') {
      throw new Error(`Bad protocol in URL '${this.settings.url}'.`)
    }

    const filePath = path.join(this.root, path.dirname(url.pathname), `${path.basename(url.pathname, '.json')}-${query.valueCurrency}.json`)
    const data = JSON.parse(fs.readFileSync(filePath).toString('utf-8'))
    return [data, filePath]
  }

  async queryCryptoRates(query: CryptoQuery): Promise<CryptoAnswer> {
    const [data, filePath] = this.getFile()

    if (!('crypto' in data)) {
      throw new Error(`There is no 'crypto' section in rate data '${filePath}'.`)
    }

    if (!(query.asset in data.crypto)) {
      throw new Error(`There is no '${query.asset}' available in 'crypto' section of rate data '${filePath}'.`)
    }

    const key = query.time.substring(0, 10)
    if (!(key in data.crypto[query.asset])) {
      throw new Error(`There is no timestamp '${key}' for '${query.asset}' in 'crypto' section of rate data '${filePath}'.`)
    }

    return {
      value: new Decimal(data.crypto[query.asset][key])
    }
  }

  async queryCurrencyRates(query: CurrencyQuery): Promise<CurrencyAnswer | null> {
    const [data, filePath] = this.getFile()

    if (!('currency' in data)) {
      throw new Error(`There is no 'currency' section in rate data '${filePath}'.`)
    }

    if (!(query.currency in data.currency)) {
      throw new Error(`There is no '${query.currency}' available in 'currency' section of rate data '${filePath}'.`)
    }

    const key = query.time.substring(0, 10)
    if (!(key in data.currency[query.currency])) {
      throw new Error(`There is no timestamp '${key}' for '${query.currency}' in 'currency' section of rate data '${filePath}'.`)
    }

    return {
      value: new Decimal(data.currency[query.currency][key])
    }
  }
}
