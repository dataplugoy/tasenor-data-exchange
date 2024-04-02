import express from 'express'
import config, { Config } from './config'
import { connect } from './connect'
import { PrismaClient } from '@prisma/client'
import { BaseModel } from './models/BaseModel'
import { log } from '@tasenor/common'

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
