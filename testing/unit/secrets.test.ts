import { describe, expect, test } from 'vitest'
import prisma from '@prisma/client'
import { decryptSecret, decryptSecrets, encryptSecret, encryptSecrets, hasPlainSecrets, isEncrypted } from '../../backend/src/lib/secrets'
import { ServiceModel } from '../../backend/src/models/ServiceModel'
import { OutputDestinationModel } from '../../backend/src/models/OutputDestinationModel'
import { TasenorDriverSettings } from '../../backend/src/types/DriverSettings'

describe('Secrets', () => {

  test('encryption round trip', () => {
    const encrypted = encryptSecret('pass word')
    expect(isEncrypted(encrypted)).toBe(true)
    expect(encrypted).not.toContain('pass')
    expect(decryptSecret(encrypted)).toBe('pass word')
    // Random IV, so encrypting again gives a different value.
    expect(encryptSecret('pass word')).not.toBe(encrypted)
    // Already encrypted and plain values are kept.
    expect(encryptSecret(encrypted)).toBe(encrypted)
    expect(decryptSecret('plain')).toBe('plain')
  })

  test('tampered value is rejected', () => {
    const encrypted = encryptSecret('secret')
    const tampered = encrypted.substring(0, encrypted.length - 4) + (encrypted.endsWith('AAAA') ? 'BBBB' : 'AAAA')
    expect(() => decryptSecret(tampered)).toThrow()
  })

  test('only secret fields are encrypted', () => {
    const settings = { host: 'https://x', user: 'me', password: 'p', apiKey: 'k', key: '' }
    const encrypted = encryptSecrets(settings)
    expect(encrypted.host).toBe('https://x')
    expect(encrypted.user).toBe('me')
    expect(isEncrypted(encrypted.password)).toBe(true)
    expect(isEncrypted(encrypted.apiKey)).toBe(true)
    expect(encrypted.key).toBe('')
    expect(settings.password).toBe('p')
    expect(hasPlainSecrets(settings)).toBe(true)
    expect(hasPlainSecrets(encrypted)).toBe(false)
    expect(decryptSecrets(encrypted)).toStrictEqual(settings)
  })

  test('services store secrets encrypted and use them decrypted', () => {
    const data = ServiceModel.fromRequest({ name: 'Rates', driver: 'TASENOR', url: 'https://x', user: 'me', password: 'secret' })
    const stored = data.settings as { password: string }
    expect(isEncrypted(stored.password)).toBe(true)
    // Updating without a password keeps the stored one as it is.
    const again = ServiceModel.fromRequest({ name: 'Rates', driver: 'TASENOR', url: 'https://x', user: 'me' }, data.settings as never)
    expect((again.settings as { password: string }).password).toBe(stored.password)

    const model = new ServiceModel({ id: 1, userId: 1, created: new Date(), updated: new Date(), ...data } as prisma.Service)
    const service = model.getService() as unknown as { settings: { password: string } }
    expect(service.settings.password).toBe('secret')
    expect(model.toResponse().hasPassword).toBe(true)
  })

  test('output destinations give drivers decrypted settings', () => {
    const settings = encryptSecrets({ host: 'https://x', user: 'me', password: 'secret', database: 'db' })
    const model = new OutputDestinationModel({ id: 1, flowPlanId: 1, type: 'TASENOR', settings, created: new Date(), updated: new Date() } as prisma.OutputDestination)
    const driver = model.getDriver({ currency: 'EUR', language: 'en' }, {}) as unknown as { settings: TasenorDriverSettings }
    expect(driver.settings.password).toBe('secret')
    expect(isEncrypted((model.data.settings as { password: string }).password)).toBe(true)
  })
})
