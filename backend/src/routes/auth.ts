import express from 'express'
import { UserModel } from '../models/UserModel'
import { compare, sign } from '../lib/crypt'
import AuthRequest from '../../src/types/API/auth/AuthRequest.json'
import RegisterRequest from '../../src/types/API/auth/RegisterRequest.json'
import { ProjectModel } from '../models/ProjectModel'
import prisma from '@prisma/client'
import { validate } from '../lib/validate'

const router = express.Router()

/**
 * Login attempt returns token if successful.
 */
router.post('/',
  validate(AuthRequest),
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

    res.status(403).send({ message: 'Invalid user or password.' })
  }
)

/**
 * Register user.
 */
router.post('/register',
  validate(RegisterRequest),
  async (req, res) => {
    const { email, password, name, address, zip, city, country, projectName } = req.body
    const old = await UserModel.find(email)
    if (old) {
      return res.status(400).send({ message: 'User already registered.' })
    }
    if (!email) {
      return res.status(400).send({ message: 'Email is required.' })
    }
    if (!password) {
      return res.status(400).send({ message: 'Password is required.' })
    }
    if (!name) {
      return res.status(400).send({ message: 'Name is required.' })
    }
    const user = await UserModel.save({ email, password, name, address, zip, city, country })
    const token = await sign({ id: user.id }, 'tadex-api')

    const project = await ProjectModel.save({ userId: user.id, name: projectName, settings: { currency: 'EUR', language: 'fi' } })
    await UserModel.update<prisma.User, UserModel>(user, { settings: { projectId: project.id } })

    return res.status(201).send({
      token,
      user: {
        id: user.id,
        email: user.data.email,
        name: user.data.name,
        address: user.data.address,
        zip: user.data.zip,
        city: user.data.city,
        country: user.data.country,
        settings: { projectId: project.id },
      }
    })
  }
)

export default router
