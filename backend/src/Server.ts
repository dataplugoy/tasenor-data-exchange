import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import config, { Config } from './config'
import { connect } from './connect'
import { PrismaClient } from '@prisma/client'
import { BaseModel } from './models/BaseModel'
import { ServiceModel } from './models/ServiceModel'
import { OutputDestinationModel } from './models/OutputDestinationModel'
import { error, log } from '@tasenor/common'
import routes from './routes'
import Decimal from 'decimal.js'
import { initI18N } from './lib/i18n/t'

Decimal.set({ precision: 50 })

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

    await initI18N()

    BaseModel.setDb(await connect())

    // Secrets saved before encryption was used.
    const services = await ServiceModel.encryptStoredSecrets()
    const destinations = await OutputDestinationModel.encryptStoredSecrets()
    if (services || destinations) {
      log(`Encrypted secrets of ${services} services and ${destinations} output destinations.`)
    }

    // Log requests.
    this.app.use((req, res, next) => {
      log(req.method, req.originalUrl.replace(/token=[^&]*/, 'token=XXXXXXXXXXXXX'))
      next()
    })

    // Basics.
    this.app.use(express.json({ limit: '500Mb' }))
    this.app.use(express.urlencoded({ limit: '500Mb', extended: true }))

    // Security.
    // The renewed token is read by the UI also when it is on another origin.
    this.app.use(cors({ exposedHeaders: ['X-Renewed-Token'] }))
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

    // Unhandled errors: log them, but do not show details (like stack traces) to the client.
    this.app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
      error('Unhandled error:', err)
      if (res.headersSent) {
        return next(err)
      }
      res.status(500).send({ message: 'Internal server error.' })
    })

    this.app.listen(this.config.PORT, () => {
      log(`Server started on port ${this.config.PORT}.`)
    })

    process.on('SIGTERM', () => {
      process.exit()
    })
  }
}

(async () => {
  const server = new TasenorDataExchangeServer()
  server.start()
})()
