import { describe, expect, test } from 'vitest'
import { Service } from '../../backend/src/lib/services/Service'

class PlainService extends Service {
  async fetch(): Promise<unknown> {
    return this.GET('/')
  }
}

describe('Service requests', () => {

  test('a service not reached gives the error of the connection', async () => {
    // Nothing listens on port 1.
    const service = new PlainService({ url: 'http://127.0.0.1:1' })
    await expect(service.fetch()).rejects.toThrow(/ECONNREFUSED/)
  })
})
