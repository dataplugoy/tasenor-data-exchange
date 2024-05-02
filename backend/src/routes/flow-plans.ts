import express from 'express'
import { authorize } from '../lib/authorize'
import { ProjectModel } from '../models/ProjectModel'
import { FlowPlanModel } from '../models/FlowPlanModel'
import { BatchModel } from '../models/BatchModel'
import { param } from '../lib/param'
import CreateFlowPlanRequest from '../../src/types/API/flow-plans/CreateFlowPlanRequest.json'
import ContinueFlowPlanRequest from '../../src/types/API/flow-plans/ContinueFlowPlanRequest.json'
import { InputSourceModel } from '../models/InputSourceModel'
import { OutputDestinationModel } from '../models/OutputDestinationModel'
import { AlertException } from '../exceptions/AlertException'
import { error, log } from '@tasenor/common'
import { AlertModel } from '../models/AlertModel'
import { validate } from '../lib/validate'

const router = express.Router()

router.post('/',
  authorize(),
  validate(CreateFlowPlanRequest),
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
    res.status(201).send(plan.data)
  }
)

router.get('/:id',
  authorize(),
  param('flowPlanId'),
  async (req, res) => {

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
            outputItems: { where: { delivered: true } }
          }
        }
      },
      where: {
        flowPlanId: res.locals.id
      },
      orderBy: [{
        created: 'desc'
      }]
    })

    res.send({
      ...res.locals.flowPlan.data,
      project: res.locals.project.data,
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
  param('flowPlanId'),
  async (req, res) => {
    try {
      const result = await res.locals.flowPlan.run({ userId: res.locals.userId, interactive: true, repeat: 'MAX' })
      res.send(result)
    } catch (err) {
      if (err instanceof AlertException) {
        log(`Delivering an immediate alert to User #${err.userId}: ${err}`)
        const alert = await AlertModel.interactive(err)
        res.status(202).send(alert.data)
      }
    }
  }
)

router.post('/:id/continue',
  authorize(),
  param('flowPlanId'),
  validate(ContinueFlowPlanRequest),
  async (req, res) => {
    // Find the latest batch.
    const batch = await BatchModel.getLatest(res.locals.flowPlan)
    if (!batch) {
      error(`Cannot find any batches for ${res.locals.flowPlan}.`)
      return res.sendStatus(400)
    }

    // Set the uploaded data.
    const { name, type, data } = req.body
    log(`Uploading a file '${name}' of type ${type} to ${batch}.`)
    const content = Buffer.from(data, 'hex')
    await batch.setData(content)

    // TODO: DRY. Same as in the `run`-url.
    try {
      const result = await res.locals.flowPlan.run({ userId: res.locals.userId, interactive: true, repeat: 'MAX' })
      res.send(result)
    } catch (err) {
      if (err instanceof AlertException) {
        log(`Delivering an immediate alert to User #${err.userId}: ${err}`)
        const alert = await AlertModel.interactive(err)
        res.status(202).send(alert.data)
      }
    }
  }
)

export default router
