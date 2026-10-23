import { describe, expect, it, vi } from 'vitest'
import { EnableBankingDriver, jsonBase64 } from '../../backend/src/driver/EnableBankingDriver'
import { EnableBankingDriverSettings } from '../../backend/src/types/DriverSettings'
import { FlowPlanModel } from '../../backend/src/models/FlowPlanModel'

describe('Enable Banking', () => {

  it('fetches the transactions of all pages', async () => {
    const driver = new EnableBankingDriver({} as EnableBankingDriverSettings, { currency: 'EUR', language: 'en' })
    driver.state = { sessionId: 'S', accountId: 'A', validUntil: '2100-01-01T00:00:00Z' }
    const pages = {
      '/accounts/A/transactions': { transactions: [1, 2], continuation_key: 'k 1' },
      '/accounts/A/transactions?continuation_key=k%201': { transactions: [3], continuation_key: null },
    }
    const urls: string[] = []
    driver.GET = async <T>(url: string): Promise<T> => {
      urls.push(url)
      return pages[url] as T
    }

    expect(JSON.parse(await driver.fetchData({} as FlowPlanModel))).toStrictEqual({ transactions: [1, 2, 3] })
    expect(urls).toStrictEqual(Object.keys(pages))
  })

  it('fails the run with the address to sign in instead of exiting the server', async () => {
    const driver = new EnableBankingDriver({ sessionInDays: 90 } as EnableBankingDriverSettings, { currency: 'EUR', language: 'en' })
    driver.state = {} as never
    Object.assign(driver, { options: {} })
    driver.POST = async <T>(): Promise<T> => ({ url: 'https://bank.example/sign-in' }) as T
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never)

    await expect(driver.autheticate()).rejects.toThrow('https://bank.example/sign-in')
    expect(exit).not.toHaveBeenCalled()
    exit.mockRestore()
  })
})

describe('Enable Banking token', () => {

  it('encodes JSON as base64url without padding', () => {
    expect(jsonBase64({ a: 1 })).toBe('eyJhIjoxfQ')
    expect(jsonBase64({ kid: 'abc?>' })).toBe('eyJraWQiOiJhYmM_PiJ9')
  })
})
