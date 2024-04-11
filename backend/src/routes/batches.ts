import express from 'express'
import { authorize } from '../lib/authorize'
import { ProjectModel } from '../models/ProjectModel'
import { FlowPlanModel } from '../models/FlowPlanModel'
import { BatchModel } from '../models/BatchModel'
import { RunModel } from '../models/RunModel'
import { InputItemModel } from '../models/InputItemModel'
import { UnifiedItemModel } from '../models/UnifiedItemModel'
import { OutputItemModel } from '../models/OutputItemModel'

const router = express.Router()

router.get('/:id',
  authorize(),
  async (req, res) => {
    const userId = res.locals.userId
    // TODO: Validate params.id
    const batchId = parseInt(req.params.id)
    const batch = await BatchModel.get(batchId)
    const flowPlan = batch && await FlowPlanModel.get(batch.data.flowPlanId)
    const project = flowPlan && await ProjectModel.get(flowPlan.data.projectId)

    if (!batch || !flowPlan || !project || project.data.userId !== userId) {
      return res.sendStatus(404)
    }

    const runs = (await RunModel.findForBatch(batchId)).map(run => run.data)
    const inputs = (await InputItemModel.findForBatch(batch)).map(input => input.data)
    const unifieds = (await UnifiedItemModel.findForBatch(batch)).map(unified => unified.data)
    const outputs = (await OutputItemModel.findForBatch(batch)).map(output => output.data)

    res.send({ ...batch.data, runs, inputs, unifieds, outputs })
  }
)

export default router
