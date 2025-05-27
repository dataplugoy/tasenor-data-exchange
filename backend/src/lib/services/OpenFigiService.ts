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

export type OpenFigiResponse = Array<{ data: OpenFigiItem[] }>

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
    const items = res.map(r => r.data).reduce((prev, cur) => cur.concat(prev), [])

    return { value: items }
  }
}
