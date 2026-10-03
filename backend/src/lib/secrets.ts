import crypto from 'crypto'
import config from '../config'

/**
 * Encryption of secrets (passwords and keys) in the settings of services and output destinations.
 *
 * Secrets are encrypted with AES-256-GCM using a key derived from the server SECRET, so changing the SECRET makes
 * the stored secrets unreadable. Encrypted values have a prefix, and values without it are plain text from the time
 * before encryption: they are still accepted and get encrypted when saved.
 */
const PREFIX = 'enc:v1:'

// Setting fields holding secrets.
export const SECRET_FIELDS = ['password', 'key', 'apiKey'] as const

function secretKey(): Buffer {
  return crypto.createHash('sha256').update(`tadex-secrets:${config.SECRET}`).digest()
}

export function isEncrypted(value: unknown): boolean {
  return typeof value === 'string' && value.startsWith(PREFIX)
}

/**
 * Encrypt a secret. An already encrypted value is returned as it is.
 */
export function encryptSecret(value: string): string {
  if (isEncrypted(value)) {
    return value
  }
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', secretKey(), iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf-8'), cipher.final()])
  return PREFIX + Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64')
}

/**
 * Decrypt a secret. A value without encryption is returned as it is.
 */
export function decryptSecret(value: string): string {
  if (!isEncrypted(value)) {
    return value
  }
  const data = Buffer.from(value.substring(PREFIX.length), 'base64')
  const decipher = crypto.createDecipheriv('aes-256-gcm', secretKey(), data.subarray(0, 12))
  decipher.setAuthTag(data.subarray(12, 28))
  return Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString('utf-8')
}

/**
 * Copy of the settings with secret fields encrypted.
 */
export function encryptSecrets<T>(settings: T): T {
  const copy = { ...settings } as Record<string, unknown>
  for (const field of SECRET_FIELDS) {
    if (typeof copy[field] === 'string' && copy[field] !== '') {
      copy[field] = encryptSecret(copy[field] as string)
    }
  }
  return copy as T
}

/**
 * Copy of the settings with secret fields decrypted for use.
 * @param owner Description of the settings owner for the error message.
 * @throws Error if a secret was encrypted with a different server SECRET.
 */
export function decryptSecrets<T>(settings: T, owner = 'settings'): T {
  const copy = { ...settings } as Record<string, unknown>
  for (const field of SECRET_FIELDS) {
    if (typeof copy[field] === 'string') {
      try {
        copy[field] = decryptSecret(copy[field] as string)
      } catch {
        throw new Error(`Cannot decrypt the ${field} of ${owner}. It was encrypted with a different server SECRET, so the ${field} needs to be entered again.`)
      }
    }
  }
  return copy as T
}

/**
 * Check if settings have secrets not yet encrypted.
 */
export function hasPlainSecrets(settings: unknown): boolean {
  if (!settings || typeof settings !== 'object') {
    return false
  }
  return SECRET_FIELDS.some(field => {
    const value = (settings as Record<string, unknown>)[field]
    return typeof value === 'string' && value !== '' && !isEncrypted(value)
  })
}
