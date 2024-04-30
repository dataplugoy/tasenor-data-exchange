import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import config, { Config } from './config'
import { connect } from './connect'
import { PrismaClient } from '@prisma/client'
import { BaseModel } from './models/BaseModel'
import { error, log } from '@tasenor/common'
import routes from './routes'

class TasenorDataExchangeServer {
  public app = express()
  public config: Config
  private db: PrismaClient

  constructor() {
    this.config = config
  }

  public start = async () => {

    if (!process.env.SECRET && process.env.NODE_ENV !== 'dev') {
      throw new Error('Cannot run server without SECRET environment variable unless in dev-mode.')
    }

    BaseModel.setDb(await connect())

    // Log requests.
    this.app.use((req, res, next) => {
      log(req.method, req.originalUrl)
      next()
    })

    // Basics.
    this.app.use(express.urlencoded({ extended: true }))
    this.app.use(express.json())

    // Security.
    this.app.use(cors())
    const contentSecurityPolicy = {
      useDefaults: true,
      crossOriginResourcePolicy: { policy: 'same-site' },
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
      }
    }
    this.app.use(helmet({ contentSecurityPolicy }))

    this.app.use('/api/v1', routes)

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
