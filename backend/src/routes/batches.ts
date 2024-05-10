import express from 'express'
import { authorize } from '../lib/authorize'
import { RunModel } from '../models/RunModel'
import { InputItemModel } from '../models/InputItemModel'
import { UnifiedItemModel } from '../models/UnifiedItemModel'
import { OutputItemModel } from '../models/OutputItemModel'
import { param } from '../lib/param'

const router = express.Router()

router.get('/:id',
  authorize(),
  param('batchId'),
  async (req, res) => {
    const runs = (await RunModel.findForBatch(res.locals.id)).map(run => run.data)
    const inputs = (await InputItemModel.findForBatch(res.locals.id)).map(input => input.data)
    const unifieds = (await UnifiedItemModel.findForBatch(res.locals.id)).map(unified => unified.data)
    const outputs = (await OutputItemModel.findForBatch(res.locals.id)).map(output => output.data)

    res.send({ ...res.locals.batch.data, runs, inputs, unifieds, outputs })
  }
)

export default router
