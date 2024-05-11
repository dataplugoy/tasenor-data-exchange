import { getToken, verify } from './crypt'

/**
 * A middleware checking for signed token.
 * @returns Token checker middleware function.
 */
export const authorize = () => {
  return (req, res, next) => {
    const token = getToken(req)

    if (!token) {
      return res.sendStatus(401)
    }
    const payload = verify(token, 'tadex-api')
    if (!payload) {
      return res.sendStatus(401)
    }

    res.locals.token = token
    res.locals.userId = payload.id

    next()
  }
}
