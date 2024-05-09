import express from 'express'
import { authorize } from '../lib/authorize'
import { param } from '../lib/param'
import { error } from '@tasenor/common'

const router = express.Router()

router.get('/:id/accounts',
  authorize(),
  param('outputDestinationId'),
  async (_req, res) => {
    const driver = await res.locals.flowPlan.getOutputDriver({ userId: res.locals.userId })
    try {
      const accounts = await driver.fetchRemoteAccounts()
      res.send(accounts)
    } catch (err) {
      error(err)
      res.sendStatus(502)
    }
  }
)

export default router
