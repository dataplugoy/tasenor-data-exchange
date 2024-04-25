import express from 'express'
import { authorize } from '../lib/authorize'
import { ProjectModel } from '../models/ProjectModel'
import { FlowPlanModel } from '../models/FlowPlanModel'
import { BatchModel } from '../models/BatchModel'
import { param } from '../lib/param'
import CreateFlowPlanRequest from '../../src/types/API/flow-plans/CreateFlowPlanRequest.json'
import { AllowedSchema, Validator } from 'express-json-validator-middleware'

const router = express.Router()
const { validate } = new Validator({})

router.post('/',
  authorize(),
  validate({ body: CreateFlowPlanRequest as AllowedSchema }),
  async (req, res) => {
    const userId = res.locals.userId
    res.send({ userId })
  }
)

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

router.get('/:id/run',
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

    const result = await plan.run({ repeat: 'MAX' })

    res.send(result)
  }
)

export default router
