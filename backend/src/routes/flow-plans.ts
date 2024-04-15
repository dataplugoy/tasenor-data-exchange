import express from 'express'
import { authorize } from '../lib/authorize'
import { ProjectModel } from '../models/ProjectModel'
import { FlowPlanModel } from '../models/FlowPlanModel'
import { BatchModel } from '../models/BatchModel'
import { param } from '../lib/param'

const router = express.Router()

router.get('/:id',
  authorize(),
  param('id'),
  async (req, res) => {
    const userId = res.locals.userId
    const flowPlanId = res.locals.id
    const plan = await FlowPlanModel.get(flowPlanId)
    const project = plan && await ProjectModel.get(plan?.data.projectId)

    if (!plan || !project || project.data.userId !== userId) {
      return res.sendStatus(404)
    }
    const batches = await BatchModel.findForFlow(plan.id)
    res.send({ ...plan.data, project: project.data, batches: batches.map(batch => batch.data) })
  }
)

export default router
