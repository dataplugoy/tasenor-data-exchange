import { describe, expect, it } from 'vitest'
import { DateTime } from 'luxon'
import { ProcountorDriver } from '../../backend/src/driver/ProcountorDriver'
import { ProcountorDriverSettings } from '../../backend/src/types/DriverSettings'
import { SettingsModel } from '../../backend/src/models/SettingsModel'

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
