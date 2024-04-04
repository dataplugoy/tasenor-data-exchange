import bcrypt from 'bcrypt'
import { TokenAudience, TokenPayload } from '../types/TokenPayload'
import { Token } from '@tasenor/common'
import jwt, { Jwt } from 'jsonwebtoken'
import config from '../config'

const TOKEN_DEFAULT_EXPIRY_TIME = 6000

/**
 * Create one way hash for a password.
 * @param password A password.
 * @returns
 */
export async function hash(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(13)
  const hash = await bcrypt.hash(password, salt)
  return hash
}

/**
 * Verify that given hash has been created from the given password.
 * @param password
 * @param hash
 * @returns
 */
export async function compare(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

/**
 * Sign the payload with the given secret.
 * @param payload
 * @param expires
 * @returns A JSON web token.
 */
export async function sign(payload: TokenPayload, audience: TokenAudience, expires = 0): Promise<Token> {
  const secret = config.SECRET
  if (!secret) {
    throw new Error('Cannot find secret to sign a token.')
  }
  const options = {
    audience,
    expiresIn: expires || TOKEN_DEFAULT_EXPIRY_TIME,
    issuer: 'tadex'
  }

  const token = jwt.sign({ data: payload }, secret, options)
  return token as Token
}
