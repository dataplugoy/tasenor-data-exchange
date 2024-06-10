import express from 'express'
import dot from 'dot-object'
import { authorize } from '../lib/authorize'
import { ProjectModel } from '../models/ProjectModel'
import { FlowPlanModel } from '../models/FlowPlanModel'
import { BatchModel } from '../models/BatchModel'
import { param } from '../lib/param'
import CreateFlowPlanRequest from '../../src/types/API/flow-plans/CreateFlowPlanRequest.json'
import ContinueFlowPlanRequest from '../../src/types/API/flow-plans/ContinueFlowPlanRequest.json'
import ConfigureFlowPlanRequest from '../../src/types/API/flow-plans/ConfigureFlowPlanRequest.json'
import UpdateSetupRequest from '../../src/types/API/flow-plans/UpdateSetupRequest.json'
import UpdateRulesRequest from '../../src/types/API/flow-plans/UpdateRulesRequest.json'
import { InputSourceModel } from '../models/InputSourceModel'
import { OutputDestinationModel } from '../models/OutputDestinationModel'
import { AlertException } from '../exceptions/AlertException'
import { error, log } from '@tasenor/common'
import { AlertModel } from '../models/AlertModel'
import { validate } from '../lib/validate'
import { RuleModel } from '../models/RuleModel'
import { Notes } from '../types/API/Notes'
import { t } from '../lib/i18n/t'

const router = express.Router()

router.post('/',
  authorize(),
  validate(CreateFlowPlanRequest),
  async (req, res) => {
    const userId = res.locals.userId
    const { projectId, title, source, destination } = req.body
    const project = await ProjectModel.get(projectId)

    if (!project) {
      error('Project not found.')
      return res.sendStatus(400)
    }
    if (project.data.userId !== userId) {
      error('Project is for different user.')
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

/**
 * Helper to continue execution of the batch.
 */
async function executeBatch(req, res, notes: Notes = {}) {
  try {
    const result = await res.locals.flowPlan.run(
      {
        userId: res.locals.userId,
        flowPlanId: res.locals.flowPlan.id,
        interactive: true,
        repeat: 'MAX'
      },
      notes
    )
    res.send(result)
  } catch (err) {
    if (err instanceof AlertException) {
      log(`Delivering an immediate alert to User #${err.userId}: ${err}`)
      const alert = await AlertModel.interactive(err)
      res.status(202).send(alert.data)
    }
  }
}

router.get('/:id/run',
  authorize(),
  param('flowPlanId'),
  async (req, res) => await executeBatch(req, res)
)

router.post('/:id/upload',
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
    if (batch.state !== 'BATCH_CREATED') {
      error(`The ${batch} is in wrong state to upload data.`)
      return res.sendStatus(400)
    }
    if (batch.data.data) {
      error(`The ${batch} has already data.`)
      return res.sendStatus(400)
    }

    // Set the uploaded data.
    const { name, type, data } = req.body
    log(`Uploading a file '${name}' of type ${type} to ${batch}.`)
    const content = Buffer.from(data, 'hex')
    await batch.setData(content)
    await batch.detectEncoding()

    const lang = res.locals.project.settings.language
    const uploaded = t(lang, 'Uploaded a file {{name}} of type {{type}} ({{size}} bytes)', { name, type, size: data.length / 2 })
    await executeBatch(req, res, { uploaded })
  }
)

router.patch('/:id/configure',
  authorize(),
  param('flowPlanId'),
  validate(ConfigureFlowPlanRequest),
  async (req, res) => {
    // Find the latest batch.
    const batch = await BatchModel.getLatest(res.locals.flowPlan)
    if (!batch) {
      error(`Cannot find any batches for ${res.locals.flowPlan}.`)
      return res.sendStatus(400)
    }

    await res.locals.flowPlan.updateSetup(req.body)

    await executeBatch(req, res, { configured: dot.dot(req.body) })
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

router.get('/:id/rules',
  authorize(),
  param('flowPlanId'),
  async (req, res) => {
    const name = await res.locals.flowPlan.getInputDriverName()
    const rules = await RuleModel.findForFlow(res.locals.id, `${name}.json`)
    res.send(rules.map(rule => rule.data))
  }
)

router.patch('/:id/rules',
  authorize(),
  param('flowPlanId'),
  validate(UpdateRulesRequest),
  async (req, res) => {
    const name = await res.locals.flowPlan.getInputDriverName()
    const rules = await (await RuleModel.findForFlow(res.locals.id, `${name}.json`)).reduce((prev, cur) => ({ ...prev, [cur.name]: cur }), {})
    const oldRules = new Set(Object.keys(rules))

    for (const rule of req.body) {
      if (oldRules.has(rule.name)) {
        log(`Updating old rule ${rules[rule.name]}`)
        const { filter, key, result } = rule
        rules[rule.name].data.flowPlanId = res.locals.id
        rules[rule.name].data.filter = filter
        rules[rule.name].data.key = key || null
        rules[rule.name].data.result = result
        await RuleModel.save(rules[rule.name])
        oldRules.delete(rule.name)
      } else {
        log(`Creating new rule ${JSON.stringify(rule)}.`)
        await RuleModel.save({
          flowPlanId: res.locals.id,
          name: rule.name,
          key: rule.key || null,
          priority: 50,
          filter: rule.filter,
          result: rule.result,
          filterView: {},
          resultView: {},
        })
      }
    }

    for (const name of [...oldRules]) {
      log(`Removing ${rules[name]}`)
      await rules[name].destroy()
    }

    res.sendStatus(204)
  }
)

export default router
