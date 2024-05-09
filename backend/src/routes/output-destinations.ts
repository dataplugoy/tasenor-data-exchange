import express from 'express'
import { authorize } from '../lib/authorize'
import { ProjectModel } from '../models/ProjectModel'
import { FlowPlanModel } from '../models/FlowPlanModel'
import { param } from '../lib/param'
import { OutputItemModel } from '../models/OutputItemModel'

const router = express.Router()

router.get('/:id/accounts',
  authorize(),
  param('outputDestinationId'),
  async (_req, res) => {
    const driver = await res.locals.flowPlan.getOutputDriver({ userId: res.locals.userId })
    // TODO: Ask accounts from driver.
    res.send([])
  }
)

export default router
