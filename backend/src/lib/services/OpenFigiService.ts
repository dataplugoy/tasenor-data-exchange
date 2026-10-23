import { ServiceType } from '@prisma/client'
import { Service, TickerAnswer, TickerQuery } from './Service'

export interface OpenFigiItem {
  figi: string
  name: string
  ticker: string
  exchCode: string
  compositeFIGI: string
  securityType: string
  marketSector: string
  shareClassFIGI: string
  securityType2: string
  securityDescription: string
}

// An identifier not found has a warning instead of data.
export type OpenFigiResponse = Array<{ data?: OpenFigiItem[], warning?: string, error?: string }>

export class OpenFigiService extends Service {

  getCababilities(): ServiceType[] {
    return ['TICKERS']
  }

  protected headers(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-OPENFIGI-APIKEY': this.settings.key as string
    }
    return headers
  }

  async queryTickers(query: TickerQuery): Promise<TickerAnswer | null> {
    const res = await this.POST<OpenFigiResponse>('/v3/mapping', [{ idType: 'ID_ISIN', idValue: query.isin }])
    let items = res.flatMap(r => r.data || [])

    if (query.exchange) {
      switch (query.exchange) {
        case 'FRA':
          items = items.filter(item => ['GR', 'NF'].includes(item.exchCode))
          break
        case 'HEL':
          items = items.filter(item => ['FH'].includes(item.exchCode))
          break
        case 'NYSE':
          items = items.filter(item => ['UA', 'UC', 'UM', 'UP'].includes(item.exchCode))
          break
        default:
          throw new Error(`An exchange code ${query.exchange} not supported.`)
      }
    }

    return { value: items }
  }
}
