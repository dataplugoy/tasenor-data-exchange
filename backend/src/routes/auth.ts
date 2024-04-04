import express from 'express'
import { UserModel } from '../models/UserModel'
import { compare, sign } from '../lib/crypt'

const router = express.Router()

// TODO: Validate body.
router.post('/', async (req, res) => {
  const { email, password } = req.body
  const user = await UserModel.find(email)
  if (user) {
    if (await compare(password, user.data.password)) {

      const token = await sign({ id: user.id }, 'tadex-api')

      return res.send({
        token,
        user: {
          id: user.id,
          email: user.data.email,
          name: user.data.name,
          address: user.data.address,
          zip: user.data.zip,
          city: user.data.city,
          country: user.data.country,
          settings: user.data.settings,
        }
      })
    }
  }

  res.status(401).send({ message: 'Invalid user or password.' })
})

export default router
