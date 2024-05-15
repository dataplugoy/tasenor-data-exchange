import express from 'express'
import { authorize } from '../lib/authorize'
import { ProjectModel } from '../models/ProjectModel'
import { FlowPlanModel } from '../models/FlowPlanModel'
import { BatchModel } from '../models/BatchModel'
import { param } from '../lib/param'
import CreateFlowPlanRequest from '../../src/types/API/flow-plans/CreateFlowPlanRequest.json'
import ContinueFlowPlanRequest from '../../src/types/API/flow-plans/ContinueFlowPlanRequest.json'
import UpdateSetupRequest from '../../src/types/API/flow-plans/UpdateSetupRequest.json'
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
      error('Project missing or different user.')
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
        encoding: true,
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
        outputDeliveredCount: line._count.outputItems,
        data: line.data === null ? null : line.data.toString(line.encoding)
      })
      )
    })
  }
)

router.get('/',
  authorize(),
  async (req, res) => {
    const plans = await FlowPlanModel.findForUser(res.locals.userId)
    if (plans && plans instanceof Array) {
      res.send(plans.map(p => p.data))
    } else {
      res.sendStatus(404)
    }
  }
)

router.get('/:id/input',
  authorize(),
  param('flowPlanId'),
  async (req, res) => {
    const input = await InputSourceModel.findForFlow(res.locals.id)
    if (input) {
      res.send(input.data)
    } else {
      res.sendStatus(404)
    }
  }
)

router.get('/:id/output',
  authorize(),
  param('flowPlanId'),
  async (req, res) => {
    const output = await OutputDestinationModel.findForFlow(res.locals.id)
    if (output) {
      res.send(output.data)
    } else {
      res.sendStatus(404)
    }
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
    // TODO: We could verify that the state is waiting and data is not yet set for the batch.

    // Set the uploaded data.
    const { name, type, data } = req.body
    log(`Uploading a file '${name}' of type ${type} to ${batch}.`)
    const content = Buffer.from(data, 'hex')
    await batch.setData(content)
    await batch.detectEncoding()

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

router.patch('/:id/setup',
  authorize(),
  param('flowPlanId'),
  validate(UpdateSetupRequest),
  async (req, res) => {
    await res.locals.flowPlan.updateSetup(req.body)
    res.send(res.locals.flowPlan.data.setup)
  }
)

router.delete('/:id',
  authorize(),
  param('flowPlanId'),
  async (req, res) => {
    await res.locals.flowPlan.destroy()
    res.sendStatus(204)
  }
)

export default router
