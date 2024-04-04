import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import config, { Config } from './config'
import { connect } from './connect'
import { PrismaClient } from '@prisma/client'
import { BaseModel } from './models/BaseModel'
import { error, log } from '@tasenor/common'
import routes from './routes'
import { ValidationError } from 'express-json-validator-middleware'

class TasenorDataExchangeServer {
  public app = express()
  public config: Config
  private db: PrismaClient

  constructor() {
    this.config = config
  }

  public start = async () => {

    this.db = await connect()
    BaseModel.setDb(this.db)

    // Log requests.
    this.app.use((req, res, next) => {
      log(req.method, req.originalUrl)
      next()
    })

    // Basics.
    this.app.use(express.urlencoded({ extended: true }))
    this.app.use(express.json())

    // Security.
    // TODO: Configure origin.
    const origin = 'localhost'
    const apiOrigin = 'localhost'
    this.app.use(cors({ origin }))
    const contentSecurityPolicy = {
      useDefaults: true,
      crossOriginResourcePolicy: { policy: 'same-site' },
      directives: {
        defaultSrc: ["'self'", apiOrigin],
        imgSrc: ["'self'", 'data:', apiOrigin],
        scriptSrc: ["'self'", "'unsafe-eval'"]
      }
    }
    this.app.use(helmet({ contentSecurityPolicy }))

    this.app.use('/api/v1', routes)

    // Validation catcher.
    this.app.use((err, req, res, next) => {
      if (err instanceof ValidationError) {
        error(`Validation error: ${req.method} ${req.originalUrl}`, JSON.stringify(err.validationErrors))
        res.status(400).send({
          message: 'Invalid request parameters.'
        })
        next()
      } else {
        next(err)
      }
    })

    this.app.listen(this.config.PORT, () => {
      log(`Server started on port ${this.config.PORT}.`)
    })

    process.on('SIGTERM', () => {
      this.db.$disconnect()
      process.exit()
    })
  }
}

(async () => {
  const server = new TasenorDataExchangeServer()
  server.start()
})()
