import express from 'express'
import { authorize } from '../lib/authorize'
import { ProjectModel } from '../models/ProjectModel'
import { FlowPlanModel } from '../models/FlowPlanModel'
import { BatchModel } from '../models/BatchModel'
import { param } from '../lib/param'
import CreateFlowPlanRequest from '../../src/types/API/flow-plans/CreateFlowPlanRequest.json'
import { AllowedSchema, Validator } from 'express-json-validator-middleware'
import { InputSourceModel } from '../models/InputSourceModel'
import { OutputDestinationModel } from '../models/OutputDestinationModel'

const router = express.Router()
const { validate } = new Validator({})

router.post('/',
  authorize(),
  validate({ body: CreateFlowPlanRequest as AllowedSchema }),
  async (req, res) => {
    const userId = res.locals.userId
    const { projectId, title, source, destination } = req.body
    const project = await ProjectModel.get(projectId)

    if (!project || project.data.userId !== userId) {
      return res.sendStatus(400)
    }

    const plan = await FlowPlanModel.save({
      title,
      projectId
    })
    await InputSourceModel.save({
      type: source.type,
      flowPlanId: plan.id,
      settings: source.settings
    })
    await OutputDestinationModel.save({
      type: destination.type,
      flowPlanId: plan.id,
      settings: destination.settings
    })
    res.send(plan.data)
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

    const batches = await BatchModel.db.findMany({
      select: {
        id: true,
        flowPlanId: true,
        number: true,
        state: true,
        lastStamp: true,
        data: true,
        initialStock: true,
        endStock: true,
        completed: true,
        created: true,
        updated: true,
        _count: {
          select: {
            outputItems: { where: { delivered: true }}
          }
        }
      },
      orderBy: [{
        created: 'desc'
      }]
    })

    res.send({
      ...plan.data,
      project: project.data,
      batches: batches.map(line => ({
          ...line,
          _count: undefined,
          outputDeliveredCount: line._count.outputItems
        })
      )
    })
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
