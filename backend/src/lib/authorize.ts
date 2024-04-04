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
      return res.sendStatus(403)
    }

    res.locals.token = token
    Object.assign(res.locals, payload)

    next()
  }
}
