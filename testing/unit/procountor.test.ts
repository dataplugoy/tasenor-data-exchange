import { describe, expect, it } from 'vitest'
import { DateTime } from 'luxon'
import { ProcountorDriver } from '../../backend/src/driver/ProcountorDriver'
import { ProcountorDriverSettings } from '../../backend/src/types/DriverSettings'
import { SettingsModel } from '../../backend/src/models/SettingsModel'
import { TransactionLine } from '../../backend/src/types/API/TransactionLine'

describe('Procountor authentication', () => {

  const driver = (expiresInSeconds: number): [ProcountorDriver, string[]] => {
    const driver = new ProcountorDriver({ apiKey: 'KEY' } as ProcountorDriverSettings, { currency: 'EUR', language: 'en' })
    driver.systemSettings = { url: 'https://procountor', data: { options: { clientId: 'C', clientSecret: 'S', redirectUrl: 'R' } } } as unknown as SettingsModel
    driver.state = { token: 'OLD', expires: DateTime.now().plus({ seconds: expiresInSeconds }).toUTC().toISO() as string }
    const requests: string[] = []
    driver.request = async <T>(method: string, url: string): Promise<T> => {
      requests.push(`${method} ${url}`)
      return { access_token: 'NEW', expires_in: 3600 } as T
    }
    return [driver, requests]
  }

  it('reuses a token valid long enough', async () => {
    const [procountor, requests] = driver(60)
    expect((await procountor.autheticate()).token).toBe('OLD')
    expect(requests).toStrictEqual([])
  })

  it('renews a token expiring within the margin', async () => {
    const [procountor, requests] = driver(3)
    expect((await procountor.autheticate()).token).toBe('NEW')
    expect(requests).toStrictEqual(['POST https://procountor/api/oauth/token'])
  })

  it('renews an expired token', async () => {
    const [procountor] = driver(-3)
    expect((await procountor.autheticate()).token).toBe('NEW')
  })
})

describe('Procountor dimensions', () => {

  const procountor = new ProcountorDriver({ apiKey: 'KEY' } as ProcountorDriverSettings, { currency: 'EUR', language: 'en' })
  procountor.dimensions = [
    { id: 1, name: 'Project', items: [{ id: 11, codeName: 'A' }, { id: 12, codeName: 'B' }] },
    { id: 2, name: 'Person', items: [{ id: 21, codeName: 'X' }] },
  ]
  const line = (tags: string[]): TransactionLine => ({ account: '1910', amount: '-12.5', text: '', extras: { tags } })

  it('gives the value to an item of each dimension', async () => {
    expect(await procountor.resolveDimensions(line(['A', 'X']))).toStrictEqual([
      { dimensionId: 1, itemId: 11, value: -12.5 },
      { dimensionId: 2, itemId: 21, value: -12.5 },
    ])
  })

  it('refuses two items of one dimension', async () => {
    await expect(procountor.resolveDimensions(line(['A', 'B']))).rejects.toThrow("more than one item of the dimension 'Project'")
  })
})

describe('Procountor delivery', () => {

  it('keeps the receipt delivered if approving it fails', async () => {
    const driver = new ProcountorDriver({ apiKey: 'KEY', autoApprove: true } as ProcountorDriverSettings, { currency: 'EUR', language: 'en' }, { accounts: { EXPENSE: '4000', CURRENCY_EUR: '1910' } } as never)
    driver.state = { token: 'T', expires: DateTime.now().plus({ hours: 1 }).toUTC().toISO() as string }
    Object.assign(driver, {
      vat: { vatStatuses: [{ description: 'No VAT reg.', vatStatus: 1 }] },
      POST: async () => ({ id: 5 }),
      PUT: async () => { throw new Error('Approval refused.') },
    })
    const output = { data: { data: { time: '2024-01-02T12:00:00.000Z', lines: [
      { account: 'EXPENSE', amount: 10, text: 'Coffee', extras: {} },
      { account: 'CURRENCY_EUR', amount: -10, text: 'Coffee', extras: {} },
    ] } } }
    const unified = { isSales: () => false }
    expect(await driver.deliverOutput(output as never, unified as never)).toStrictEqual({ type: 'ID', id: 5 })
  })
})
