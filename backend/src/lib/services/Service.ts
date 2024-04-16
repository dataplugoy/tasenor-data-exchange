import { ServiceType } from "@prisma/client"
import { ServiceSettings } from "../../types/ServiceSettings"
import { CryptoCurrency, Currency, Timestring } from "@tasenor/common"
import Decimal from "decimal.js"

/**
 * Asking valuation in the given currency of the value in other currency.
 */
export type CurrencyQuery = {
  query: 'CURRENCY_RATES'
  time: Timestring
  currency: Currency
  valueCurrency: Currency
}

export type CurrencyAnswer = {
  value: Decimal
}

/**
 * Asking valuation in the given crypto currency of the value in other currency.
 */
export type CryptoQuery = {
  query: 'CRYPTO_RATES'
  time: Timestring
  asset: CryptoCurrency
  valueCurrency: Currency
}

export type CryptoAnswer = {
  value: Decimal
}

export type ServiceQuery = CryptoQuery | CurrencyQuery
export type ServiceAnswer = CryptoAnswer | CurrencyAnswer

/**
 * Services that can be configured and subscribed.
 */
export class Service {

  private settings: ServiceSettings

  constructor(settings: ServiceSettings) {
    this.settings = settings
  }

  /**
   * List of services implemented.
   */
  getCababilities(): ServiceType[] {
    return []
  }

  /**
   * Run the query.
   * @param query
   */
  async query(query: ServiceQuery): Promise<ServiceAnswer> {
    switch (query.query) {
      case 'CRYPTO_RATES':
        return this.queryCryptoRates(query)
      case 'CURRENCY_RATES':
        return this.queryCurrencyRates(query)
      default:
        throw new Error(`Invalid or unimplemented query ${JSON.stringify(query)}`)
    }
  }

  async queryCryptoRates(query: CryptoQuery): Promise<CryptoAnswer> {
    throw new Error(`Service '${this.constructor.name}' does not implement queryCryptoRates().`)
  }

  async queryCurrencyRates(query: CurrencyQuery): Promise<CurrencyAnswer> {
    throw new Error(`Service '${this.constructor.name}' does not implement queryCurrencyRates().`)
  }
}
