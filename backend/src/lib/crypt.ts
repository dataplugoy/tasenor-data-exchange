import bcrypt from 'bcryptjs'
import { TokenAudience, TokenPayload } from '../types/TokenPayload'
import { Token, error } from '@tasenor/common'
import jwt from 'jsonwebtoken'
import config from '../config'

const TOKEN_DEFAULT_EXPIRY_TIME = 6000
const TOKEN_ISSUER = 'tadex'

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
 * Find a token from the request if available.
 * @param request A HTTP request.
 */
export function getToken(request): Token | undefined {
  let token
  if (request.query && request.query.token) {
    token = request.query.token
  } else if (request.headers.authorization && /^Bearer /.test(request.headers.authorization)) {
    token = request.headers.authorization.substr(7)
  }
  return token
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
    issuer: TOKEN_ISSUER
  }

  const token = jwt.sign({ data: payload }, secret, options)
  return token as Token
}

/**
 * Check the token validity.
 * @param token
 * @param secret
 * @param quiet If set, do not trigger errors.
 * @returns Token payload if valid.
 */
export function verify(token: Token, audience: TokenAudience | TokenAudience[], quiet = false): TokenPayload | null {
  const secret = config.SECRET

  if (!audience) throw new Error('Cannot verify token since no audience given.')

  function fail(msg: string): void {
    if (!quiet) error(msg)
  }

  if (!token) {
    fail('No token provided.')
    return null
  }

  try {
    const decoded: jwt.JwtPayload = jwt.verify(token, secret, { audience, issuer: [TOKEN_ISSUER] }) as jwt.JwtPayload
    if (!decoded) {
      fail('Cannot decode the token.')
    } else if (!decoded.data) {
      fail(`Cannot find any payload from the token ${token}.`)
    } else {
      if (!decoded.exp) {
        fail(`Token content ${decoded} does not have exp-field.`)
        return null
      }
      if (!decoded.data) {
        fail(`Cannot find proper payload from the token ${token}.`)
        return null
      } else {
        return decoded.data
      }
    }
  } catch (err) {
    fail(`Token verification failed ${err} for ${JSON.stringify((token))}`)
  }

  return null
}
