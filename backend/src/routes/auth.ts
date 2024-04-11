import express from 'express'
import { UserModel } from '../models/UserModel'
import { compare, sign } from '../lib/crypt'
import { AllowedSchema, Validator } from 'express-json-validator-middleware'
import AuthRequest from '../../../schema/auth/AuthRequest.json'

const { validate } = new Validator({})

const router = express.Router()

/**
 * Login attempt returns token if successful.
 */
router.post('/',
  validate({ body: AuthRequest as AllowedSchema }),
  async (req, res) => {
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
  }
)

export default router
