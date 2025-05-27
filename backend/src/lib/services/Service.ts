import { ServiceType } from '@prisma/client'
import { ServiceSettings } from '../../types/ServiceSettings'
import { HttpMethod, error, CryptoCurrency, Currency, Timestring, log } from '@tasenor/common'
import Decimal from 'decimal.js'
import path from 'path'
import axios, { AxiosRequestConfig } from 'axios'
import { OpenFigiItem } from './OpenFigiService'

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

/**
 * Find information about a ticker by its ISIN code.
 */
export type TickerQuery = {
  query: 'TICKERS'
  isin: string
}

export type TickerAnswer = {
  value: OpenFigiItem[]
}

export type ServiceQuery = CryptoQuery | CurrencyQuery | TickerQuery
export type ServiceAnswer = CryptoAnswer | CurrencyAnswer | TickerAnswer

/**
 * Services that can be configured and subscribed.
 */
export class Service {

  protected settings: ServiceSettings

  constructor(settings: ServiceSettings) {
    this.settings = settings
  }

  /**
   * Root path of the repository.
   */
  get root(): string {
    return path.join(path.dirname(path.dirname(path.dirname(__dirname))), 'samples')
  }

  /**
   * List of services implemented.
   */
  getCababilities(): ServiceType[] {
    return []
  }

  /**
   * Construct standard default headers for requests.
   */
  protected headers(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    const token = this.settings.token
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    return headers
  }

  /**
   * Ensure that URL does not have double slash in the beginning.
   * @param url Local part of the URL.
   */
  private makeUrl(url: string): string {
    const baseUrl = this.settings.url.replace(/\/$/, '')
    url = url.replace(/^\//, '')
    return `${baseUrl}/${url}`
  }

  /**
   * Executor for HTTP requests.
   * @param method
   */
  private async request<T>(method: HttpMethod, url: string, data: unknown = undefined): Promise<T> {
    log(`Service ${this.constructor.name} requesting '${method} ${url.replace(/token=(.............)/, 'XXXXXXXXXXXXX')}'.`)

    const conf: AxiosRequestConfig = {
      method,
      url,
      headers: this.headers(),
      data,
    }

    const result = await axios(conf).catch(err => {
      error('Request failed: ' + JSON.stringify(err.response.data))
      throw err
    })

    return result.data
  }

  /**
   * Execute GET request.
   */
  protected async GET<T>(url): Promise<T> {
    const resp = await this.request<T>('GET', this.makeUrl(url))
    return resp
  }

  /**
   * Execute DELETE request.
   */
  protected async DELETE<T>(url): Promise<T> {
    const resp = await this.request<T>('DELETE', this.makeUrl(url))
    return resp
  }

  /**
   * Execute POST request.
   */
  protected async POST<T>(url, data): Promise<T> {
    const resp = await this.request<T>('POST', this.makeUrl(url), data)
    return resp
  }

  /**
   * Run the query.
   * @param query
   */
  async query(query: ServiceQuery): Promise<ServiceAnswer | null> {
    log(`Calling service ${JSON.stringify(query)}`)
    switch (query.query) {
      case 'CRYPTO_RATES':
        return this.queryCryptoRates(query)
      case 'CURRENCY_RATES':
        return this.queryCurrencyRates(query)
      case 'TICKERS':
        return this.queryTickers(query)
      default:
        throw new Error(`Invalid or unimplemented query ${JSON.stringify(query)}`)
    }
  }

  async queryCryptoRates(query: CryptoQuery): Promise<CryptoAnswer | null> {
    throw new Error(`Service '${this.constructor.name}' does not implement queryCryptoRates().`)
  }

  async queryCurrencyRates(query: CurrencyQuery): Promise<CurrencyAnswer | null> {
    throw new Error(`Service '${this.constructor.name}' does not implement queryCurrencyRates().`)
  }

  async queryTickers(query: TickerQuery): Promise<TickerAnswer | null> {
    throw new Error(`Service '${this.constructor.name}' does not implement queryTickers().`)
  }
}
