import express from 'express'
import bcrypt from 'bcrypt'
import { UserModel } from '../models/UserModel'

const router = express.Router()

// TODO: Move to some lib.
/**
 * Create one way hash for a password.
 * @param password A password.
 * @returns
 */
async function hash(password: string): Promise<string> {
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
async function compare(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

// TODO: Validate body.
router.post('/', async (req, res) => {
  const { email, password } = req.body
  const user = await UserModel.find(email)
  if (user) {
    if (await compare(password, user.data.password)) {
      // TODO: token
      return res.send({
        email: user.data.email,
        name: user.data.name,
        address: user.data.address,
        zip: user.data.zip,
        city: user.data.city,
        country: user.data.country,
        settings: user.data.settings,
      })
    }
  }
  res.status(401).send({ message: 'Invalid user or password.' })
})

export default router
