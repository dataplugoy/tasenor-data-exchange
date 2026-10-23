import { Token } from '@tasenor/common'
import { expect, test } from 'vitest'
import { compare, hash, sign, verify } from '../../backend/src/lib/crypt'

test('Signing and verifying token', async () => {
  const token = await sign({ id: 999 }, 'tadex-api')
  expect(verify(token, 'tadex-api')).toStrictEqual({ id: 999 })
  expect(verify(token + 'x' as Token, 'tadex-api')).toBe(null)
})

// Hashing is slow on purpose, so a busy machine needs more than the default timeout.
test('Hashing password', async () => {
  const hashed = await hash('ExactlySecr4t')
  expect(await compare('not', hashed)).toBe(false)
  expect(await compare('ExactlySecr4t', hashed)).toBe(true)
}, 30000)
