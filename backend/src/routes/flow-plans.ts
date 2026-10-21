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
import UpdateBalanceRequest from '../../src/types/API/flow-plans/UpdateBalanceRequest.json'
import UpdateSetupRequest from '../../src/types/API/flow-plans/UpdateSetupRequest.json'
import UpdateStockRequest from '../../src/types/API/flow-plans/UpdateStockRequest.json'
import UpdateRulesRequest from '../../src/types/API/flow-plans/UpdateRulesRequest.json'
import SaveRuleRequest from '../../src/types/API/flow-plans/SaveRuleRequest.json'
import OrderRulesRequest from '../../src/types/API/flow-plans/OrderRulesRequest.json'
import { MappingError } from '../lib/mapping'
import { collectFields, previewRule, recentInputs } from '../lib/preview'
import prisma from '@prisma/client'
import { InputSourceModel } from '../models/InputSourceModel'
import { OutputDestinationModel } from '../models/OutputDestinationModel'
import { AlertException } from '../exceptions/AlertException'
import { error, log } from '@tasenor/common'
import { AlertModel } from '../models/AlertModel'
import { validate } from '../lib/validate'
import { RuleModel } from '../models/RuleModel'
import { OutputItemModel } from '../models/OutputItemModel'
import { RuleQuestionModel } from '../models/RuleQuestionModel'
import { Notes } from '../types/API/Notes'
import { t } from '../lib/i18n/t'

const router: express.Router = express.Router()

router.post('/',
  authorize(),
  validate(CreateFlowPlanRequest),
  async (req, res) => {
    const userId = res.locals.userId
    const { projectId, title, firstDate, source, destination, setup } = req.body
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
      firstDate: new Date(firstDate + 'T00:00:00Z'),
      projectId,
      setup,
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
        data: line.data
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
 * IDs of flow plans having a run in progress.
 */
const runningFlowPlans: Set<number> = new Set()

/**
 * A middleware refusing to start a run for a flow plan that is already running.
 * The flow plan is reserved until the run finishes or the request ends without running.
 */
function exclusiveRun() {
  return (req, res, next) => {
    const id = res.locals.flowPlan.id
    if (runningFlowPlans.has(id)) {
      error(`${res.locals.flowPlan} is already running.`)
      return res.status(409).send({ message: 'The flow plan is already running.' })
    }
    runningFlowPlans.add(id)
    res.on('close', () => {
      if (!res.locals.runStarted) {
        runningFlowPlans.delete(id)
      }
    })
    next()
  }
}

/**
 * Helper to continue execution of the batch.
 */
async function executeBatch(req, res, notes: Notes = {}) {
  res.locals.runStarted = true
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
  } finally {
    runningFlowPlans.delete(res.locals.flowPlan.id)
  }
}

router.get('/:id/run',
  authorize(),
  param('flowPlanId'),
  exclusiveRun(),
  async (req, res) => await executeBatch(req, res)
)

router.post('/:id/upload',
  authorize(),
  param('flowPlanId'),
  exclusiveRun(),
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
  exclusiveRun(),
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

router.patch('/:id/stock',
  authorize(),
  param('flowPlanId'),
  validate(UpdateStockRequest),
  async (req, res) => {
    await res.locals.flowPlan.updateStock(req.body)
    res.send(res.locals.flowPlan.data.stock)
  }
)

router.patch('/:id/balance',
  authorize(),
  param('flowPlanId'),
  validate(UpdateBalanceRequest),
  async (req, res) => {
    await res.locals.flowPlan.updateBalance(req.body)
    res.send(res.locals.flowPlan.data.balance)
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

router.get('/:id/rules/version',
  authorize(),
  param('flowPlanId'),
  async (req, res) => {
    const { rulesVersion, rulesSaved } = res.locals.flowPlan.data
    res.send({ version: rulesVersion, saved: rulesSaved })
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

    try {
      for (const rule of req.body) {
        await RuleQuestionModel.checkAsk(res.locals.id, rule.resultView)
      }
    } catch (err) {
      return ruleError(res, err)
    }

    for (const rule of req.body) {
      if (oldRules.has(rule.name)) {
        const old = rules[rule.name]
        const { filter, key, result } = rule
        const changed = !RuleModel.sameDefinition(old.data, { filter, key, result })
        if (changed) {
          log(`Updating old rule ${old}`)
          old.data.filter = filter
          old.data.key = key || null
          old.data.result = result
          // Once edited, a rule belongs to the user and driver updates no longer touch it.
          old.data.origin = 'USER'
        }
        old.data.flowPlanId = res.locals.id
        for (const field of ['enabled', 'notes', 'kind', 'filterView', 'resultView']) {
          if (rule[field] !== undefined) {
            old.data[field] = rule[field]
          }
        }
        await RuleModel.save(old)
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
          filterView: rule.filterView || {},
          resultView: rule.resultView || {},
          origin: 'USER',
          kind: rule.kind || 'ADVANCED',
          enabled: rule.enabled ?? true,
          notes: rule.notes || '',
        })
      }
    }

    for (const name of [...oldRules]) {
      log(`Removing ${rules[name]}`)
      await rules[name].destroy()
    }

    await FlowPlanModel.rulesChanged(res.locals.id)
    res.sendStatus(204)
  }
)

/**
 * Helper to find a rule of the flow plan.
 */
async function findRule(flowPlanId: number, ruleId: string): Promise<RuleModel | null> {
  const id = parseInt(ruleId)
  if (isNaN(id)) {
    return null
  }
  const rule = await RuleModel.findUnique<prisma.Rule, RuleModel>({ id })
  return rule && rule.data.flowPlanId === flowPlanId ? rule : null
}

/**
 * Helper to respond to errors in rule data.
 */
function ruleError(res, err): void {
  if (err instanceof MappingError) {
    res.status(400).send({ message: err.message })
    return
  }
  if (err?.code === 'P2002') {
    res.status(400).send({ message: 'A rule with the same name already exists.' })
    return
  }
  throw err
}

router.post('/:id/rules',
  authorize(),
  param('flowPlanId'),
  validate(SaveRuleRequest),
  async (req, res) => {
    try {
      const data = RuleModel.fromRequest(req.body)
      await RuleQuestionModel.checkAsk(res.locals.id, req.body.resultView)
      const name = await res.locals.flowPlan.getInputDriverName()
      const rules = await RuleModel.findForFlow(res.locals.id, `${name}.json`)
      // New rule goes last.
      const priority = rules.length ? Math.min(...rules.map(rule => rule.data.priority)) : 50
      const rule = await RuleModel.save({ ...data, priority, flowPlanId: res.locals.id })
      await FlowPlanModel.rulesChanged(res.locals.id)
      log(`Created ${rule} '${rule.name}' for flow plan #${res.locals.id}.`)
      res.send(rule.data)
    } catch (err) {
      ruleError(res, err)
    }
  }
)

router.get('/:id/rules/fields',
  authorize(),
  param('flowPlanId'),
  async (req, res) => {
    res.send(collectFields(await recentInputs(res.locals.id)))
  }
)

router.post('/:id/rules/preview',
  authorize(),
  param('flowPlanId'),
  validate(SaveRuleRequest),
  async (req, res) => {
    const ruleId = req.query.ruleId ? parseInt(`${req.query.ruleId}`) : null
    try {
      await RuleQuestionModel.checkAsk(res.locals.id, req.body.resultView)
      const driver = await res.locals.flowPlan.getInputDriver({ userId: res.locals.userId, flowPlanId: res.locals.id })
      res.send(await previewRule(res.locals.flowPlan, driver, req.body, ruleId !== null && !isNaN(ruleId) ? ruleId : null))
    } catch (err) {
      ruleError(res, err)
    }
  }
)

router.put('/:id/rules/order',
  authorize(),
  param('flowPlanId'),
  validate(OrderRulesRequest),
  async (req, res) => {
    try {
      await RuleModel.setOrder(res.locals.id, req.body.ids)
      await FlowPlanModel.rulesChanged(res.locals.id)
      res.sendStatus(204)
    } catch (err) {
      ruleError(res, err)
    }
  }
)

router.put('/:id/rules/:ruleId',
  authorize(),
  param('flowPlanId'),
  validate(SaveRuleRequest),
  async (req, res) => {
    const rule = await findRule(res.locals.id, req.params.ruleId)
    if (!rule) {
      return res.sendStatus(404)
    }
    try {
      const data = RuleModel.fromRequest(req.body)
      await RuleQuestionModel.checkAsk(res.locals.id, req.body.resultView)
      await RuleModel.update<prisma.Rule, RuleModel>(rule, data)
      await FlowPlanModel.rulesChanged(res.locals.id)
      log(`Updated ${rule} '${rule.name}' for flow plan #${res.locals.id}.`)
      res.send(rule.data)
    } catch (err) {
      ruleError(res, err)
    }
  }
)

router.get('/:id/rules/:ruleId/matches',
  authorize(),
  param('flowPlanId'),
  async (req, res) => {
    const rule = await findRule(res.locals.id, req.params.ruleId)
    if (!rule) {
      return res.sendStatus(404)
    }
    const items = await OutputItemModel.findForRule(rule.id, 100)
    res.send(items.map(item => item.data))
  }
)

router.delete('/:id/rules/:ruleId',
  authorize(),
  param('flowPlanId'),
  async (req, res) => {
    const rule = await findRule(res.locals.id, req.params.ruleId)
    if (!rule) {
      return res.sendStatus(404)
    }
    await rule.destroy()
    await FlowPlanModel.rulesChanged(res.locals.id)
    log(`Deleted ${rule} '${rule.name}' from flow plan #${res.locals.id}.`)
    res.sendStatus(204)
  }
)

export default router
