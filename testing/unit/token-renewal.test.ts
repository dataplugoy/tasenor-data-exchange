import { describe, expect, test } from 'vitest'
import { renewedToken, sign, verify } from '../../backend/src/lib/crypt'

describe('Token renewal', () => {

  test('a fresh token is not renewed', async () => {
    const token = await sign({ id: 1 }, 'tadex-api')
    expect(await renewedToken(token, { id: 1 }, 'tadex-api')).toBeNull()
  })

  test('a token near its expiry is renewed for the same user', async () => {
    const token = await sign({ id: 1 }, 'tadex-api', 60)
    const renewed = await renewedToken(token, { id: 1 }, 'tadex-api')
    expect(renewed).not.toBeNull()
    expect(verify(renewed as never, 'tadex-api')).toStrictEqual({ id: 1 })
  })
})
