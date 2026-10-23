import express from 'express'
import { authorize } from '../lib/authorize'
import { RunModel } from '../models/RunModel'
import { InputItemModel } from '../models/InputItemModel'
import { UnifiedItemModel } from '../models/UnifiedItemModel'
import { OutputItemModel } from '../models/OutputItemModel'
import { param } from '../lib/param'
import { ItemErrorModel } from '../models/ItemErrorModel'
import { error } from '@tasenor/common'
import { BatchModel } from '../models/BatchModel'

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
    // Batches build on the one before, so only the latest can be abandoned.
    const latest = await BatchModel.getLatest(res.locals.flowPlan)
    if (!latest || latest.id !== res.locals.batch.id) {
      error(`Cannot abandon ${res.locals.batch} which is not the latest batch.`)
      return res.sendStatus(400)
    }
    // Output may have been delivered before the batch stopped. It is removed from the destination with the rollback,
    // which also restores the balances and assets of the plan, so that the next run does not deliver it again.
    if ((await OutputItemModel.findForBatch(res.locals.batch.id, true)).some(item => item.data.delivered)) {
      await res.locals.batch.rollback(res.locals.userId)
    } else {
      await res.locals.batch.destroy()
    }
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
    // The balances and assets of the plan are restored from the batch before, so only the latest can be undone.
    const latest = await BatchModel.getLatest(res.locals.flowPlan)
    if (res.locals.batch.state !== 'OUTPUT_DELIVERED') {
      error(`Cannot rollback ${res.locals.batch} which has wrong state ${res.locals.batch.state}.`)
      res.sendStatus(400)
    } else if (!latest || latest.id !== res.locals.batch.id) {
      error(`Cannot rollback ${res.locals.batch} which is not the latest batch.`)
      res.sendStatus(400)
    } else {
      await res.locals.batch.rollback(res.locals.userId)
      res.sendStatus(204)
    }
  }
)

export default router
