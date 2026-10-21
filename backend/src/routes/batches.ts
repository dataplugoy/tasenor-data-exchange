import express from 'express'
import { authorize } from '../lib/authorize'
import { RunModel } from '../models/RunModel'
import { InputItemModel } from '../models/InputItemModel'
import { UnifiedItemModel } from '../models/UnifiedItemModel'
import { OutputItemModel } from '../models/OutputItemModel'
import { param } from '../lib/param'
import { ItemErrorModel } from '../models/ItemErrorModel'
import { error } from '@tasenor/common'

const router: express.Router = express.Router()

router.get('/:id',
  authorize(),
  param('batchId'),
  async (_req, res) => {
    const runModels = await RunModel.findForBatch(res.locals.id)
    const runs = runModels.map(run => run.data)

    const errors = await ItemErrorModel.findForRuns(runModels.map(run => run.id))

    const inputs = (await InputItemModel.findForBatch(res.locals.id)).map(input => input.data)
    const unifieds = (await UnifiedItemModel.findForBatch(res.locals.id)).map(unified => unified.data)
    const outputs = (await OutputItemModel.findForBatch(res.locals.id)).map(output => output.data)

    res.send({ ...res.locals.batch.data, runs, inputs, unifieds, outputs, errors })
  }
)

router.delete('/:id',
  authorize(),
  param('batchId'),
  async (_req, res) => {
    await res.locals.batch.destroy()
    // An abandoned first batch may have had a different file, so its opening state is proposed again.
    if (res.locals.batch.data.number === 1) {
      await res.locals.flowPlan.clearOpeningState()
    }
    res.sendStatus(204)
  }
)

router.put('/:id/rollback',
  authorize(),
  param('batchId'),
  async (_req, res) => {
    if (res.locals.batch.state !== 'OUTPUT_DELIVERED') {
      error(`Cannot rollback ${res.locals.batch} which has wrong state ${res.locals.batch.state}.`)
      res.sendStatus(400)
    } else {
      await res.locals.batch.rollback(res.locals.userId)
      res.sendStatus(204)
    }
  }
)

export default router
