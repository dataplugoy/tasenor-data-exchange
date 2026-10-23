import { describe, expect, test } from 'vitest'
import { OpenFigiResponse, OpenFigiService } from '../../backend/src/lib/services/OpenFigiService'

class FixedService extends OpenFigiService {
  response: OpenFigiResponse = []

  protected async POST<T>(): Promise<T> {
    return this.response as T
  }
}

describe('OpenFIGI service', () => {

  test('items of the exchange are found', async () => {
    const service = new FixedService({ url: 'http://localhost', key: 'x' })
    service.response = [{ data: [{ ticker: 'NOKIA', exchCode: 'FH' }, { ticker: 'NOA3', exchCode: 'GR' }] as never }]
    const answer = await service.queryTickers({ query: 'TICKERS', isin: 'FI0009000681', exchange: 'HEL' })
    expect(answer?.value.map(item => item.ticker)).toStrictEqual(['NOKIA'])
  })

  test('unknown ISIN gives no items', async () => {
    const service = new FixedService({ url: 'http://localhost', key: 'x' })
    service.response = [{ warning: 'No identifier found.' }]
    const answer = await service.queryTickers({ query: 'TICKERS', isin: 'FI0000000000' })
    expect(answer?.value).toStrictEqual([])
  })
})
