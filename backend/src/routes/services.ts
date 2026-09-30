import express from 'express'
import { CryptoCurrency, Currency, Timestring, error, log } from '@tasenor/common'
import prisma from '@prisma/client'
import { authorize } from '../lib/authorize'
import { param } from '../lib/param'
import { validate } from '../lib/validate'
import { ServiceModel } from '../models/ServiceModel'
import { ServiceSettings } from '../types/ServiceSettings'
import { ServiceQuery, TickerAnswer } from '../lib/services/Service'
import { TestServiceResponse } from '../types/API/services/TestServiceResponse'
import SaveServiceRequest from '../../src/types/API/services/SaveServiceRequest.json'

const router: express.Router = express.Router()

router.get('/',
  authorize(),
  async (_req, res) => {
    const services = await ServiceModel.findForUser(res.locals.userId)
    res.send(services.map(service => service.toResponse()))
  }
)

router.post('/',
  authorize(),
  validate(SaveServiceRequest),
  async (req, res) => {
    const service = await ServiceModel.create<prisma.Service, ServiceModel>({ ...ServiceModel.fromRequest(req.body), userId: res.locals.userId })
    log(`Created service #${service.id} '${service.data.name}' for user #${res.locals.userId}.`)
    res.send(service.toResponse())
  }
)

router.patch('/:id',
  authorize(),
  param('serviceId'),
  validate(SaveServiceRequest),
  async (req, res) => {
    const service: ServiceModel = res.locals.service
    const data = ServiceModel.fromRequest(req.body, service.data.settings as unknown as ServiceSettings)
    Object.assign(service.data, data)
    await ServiceModel.update<prisma.Service, ServiceModel>(service, data)
    res.send(service.toResponse())
  }
)

router.delete('/:id',
  authorize(),
  param('serviceId'),
  async (_req, res) => {
    await ServiceModel.delete(res.locals.id)
    log(`Deleted service #${res.locals.id} of user #${res.locals.userId}.`)
    res.sendStatus(204)
  }
)

/**
 * Make a sample query for each capability of the service to check its settings.
 */
router.post('/:id/test',
  authorize(),
  param('serviceId'),
  async (_req, res) => {
    const service = (res.locals.service as ServiceModel).getService()
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().substring(0, 10)
    const time = `${yesterday}T12:00:00.000Z` as Timestring
    const results: TestServiceResponse = []

    for (const capability of service.getCababilities()) {
      let query: ServiceQuery
      switch (capability) {
        case 'CURRENCY_RATES':
          query = { query: capability, time, currency: 'USD' as Currency, valueCurrency: 'EUR' as Currency }
          break
        case 'CRYPTO_RATES':
          query = { query: capability, time, asset: 'BTC' as CryptoCurrency, valueCurrency: 'EUR' as Currency }
          break
        case 'TICKERS':
          query = { query: capability, isin: 'US0378331005' }
          break
      }
      const description = capability === 'TICKERS' ? 'ISIN US0378331005' : `${capability === 'CRYPTO_RATES' ? 'BTC' : 'USD'} in EUR on ${yesterday}`
      try {
        const answer = await service.query(query)
        let result = ''
        if (answer && capability === 'TICKERS') {
          result = (answer as TickerAnswer).value.map(item => item.ticker).join(', ')
        } else if (answer) {
          result = `${answer.value}`
        }
        results.push({ capability, query: description, success: answer !== null, result })
      } catch (err) {
        error(`Testing service #${res.locals.id} failed:`, err)
        results.push({ capability, query: description, success: false, error: err instanceof Error ? err.message : `${err}` })
      }
    }

    res.send(results)
  }
)

export default router
