import express from 'express'
import { authorize } from '../lib/authorize'
import { param } from '../lib/param'
import { error } from '@tasenor/common'
import OutputDestinationSettingsRequest from '../../src/types/API/output-destinations/OutputDestinationSettingsRequest.json'
import { validate } from '../lib/validate'

const router = express.Router()

router.get('/:id/accounts',
  authorize(),
  param('outputDestinationId'),
  async (_req, res) => {
    const driver = await res.locals.flowPlan.getOutputDriver({ userId: res.locals.userId })

    if (!driver.needConfiguredAccounts()) {
      return res.send([])
    }
    try {
      const accounts = await driver.fetchRemoteAccounts()
      res.send(accounts)
    } catch (err) {
      error(err)
      res.sendStatus(502)
    }
  }
)

router.patch('/:id/settings',
  authorize(),
  param('outputDestinationId'),
  validate(OutputDestinationSettingsRequest),
  async (req, res) => {
    await res.locals.outputDestination.updateSettings(req.body)
    res.send(res.locals.outputDestination.data.settings)
  }
)

export default router
