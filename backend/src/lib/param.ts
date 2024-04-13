import { getToken, verify } from './crypt'

/**
 * A middleware checking for proper id parameter.
 * @returns ID checker middleware function.
 */
export const param = (what: 'id') => {
  return (req, res, next) => {
    const id = `${req.params.id}`

    if (!/^[0-9]+$/.test(id)) {
      return res.sendStatus(400)
    }

    res.locals.id = parseInt(id)

    next()
  }
}
