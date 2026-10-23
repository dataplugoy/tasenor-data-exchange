import express from 'express'
import { authorize } from '../lib/authorize'
import { ProjectModel } from '../models/ProjectModel'
import { FlowPlanModel } from '../models/FlowPlanModel'
import { param } from '../lib/param'
import { OutputItemModel } from '../models/OutputItemModel'
import { RuleQuestionModel } from '../models/RuleQuestionModel'
import { validate } from '../lib/validate'
import { log } from '@tasenor/common'
import prisma from '@prisma/client'
import SaveRuleQuestionRequest from '../../src/types/API/projects/SaveRuleQuestionRequest.json'

const router: express.Router = express.Router()

/**
 * List of all projects for user.
 */
router.get('/',
  authorize(),
  async (_req, res) => {
    const userId = res.locals.userId
    const projects = await ProjectModel.findForUser(userId)
    res.send(projects.map(project => project.data))
  }
)

router.get('/:id/output',
  authorize(),
  param('projectId'),
  async (req, res) => {
    const plans = await FlowPlanModel.findForProject(res.locals.id)
    const items = await OutputItemModel.getAll({ delivered: true, flowPlanId: { in: plans.map(plan => plan.id) } }, [{ created: 'desc' }])
    res.send(items.map(item => item.data))
  }
)

/**
 * Questions of the project for the rules.
 */
router.get('/:id/questions',
  authorize(),
  param('projectId'),
  async (req, res) => {
    const questions = await RuleQuestionModel.findForProject(res.locals.id)
    const usage = await RuleQuestionModel.usage(res.locals.id)
    res.send(questions.map(q => ({ ...q.data, usedBy: usage[q.id] || [] })))
  }
)

/**
 * Find a question of the project.
 */
async function findQuestion(projectId: number, questionId: string): Promise<RuleQuestionModel | null> {
  const id = parseInt(questionId)
  if (isNaN(id)) {
    return null
  }
  const question = await RuleQuestionModel.findUnique<prisma.RuleQuestion, RuleQuestionModel>({ id })
  return question && question.data.projectId === projectId ? question : null
}

/**
 * Save a question or send an error, if the question is invalid or the name is in use.
 */
async function saveQuestion(res, projectId: number, body, question: RuleQuestionModel | null): Promise<void> {
  let data: Partial<prisma.RuleQuestion>
  try {
    data = RuleQuestionModel.fromRequest(body)
  } catch (err) {
    res.status(400).send({ message: err.message })
    return
  }
  // The rules asking a question depend on its kind, for example an account question gives the account of a rule.
  if (question && data.kind !== question.kind && (await RuleQuestionModel.usage(projectId))[question.id]) {
    res.status(400).send({ message: 'The kind of a question used by rules cannot be changed.' })
    return
  }
  const same = await RuleQuestionModel.findUnique<prisma.RuleQuestion, RuleQuestionModel>({ projectId_name: { projectId, name: data.name } } as unknown as Partial<prisma.RuleQuestion>)
  if (same && (!question || same.id !== question.id)) {
    res.status(400).send({ message: `The name '${data.name}' is already used by another question.` })
    return
  }
  if (question) {
    await RuleQuestionModel.update<prisma.RuleQuestion, RuleQuestionModel>(question, data)
    log(`Updated ${question} '${question.name}' of project #${projectId}.`)
  } else {
    question = await RuleQuestionModel.create<prisma.RuleQuestion, RuleQuestionModel>({ ...data, projectId })
    log(`Created ${question} '${question.name}' for project #${projectId}.`)
  }
  res.send(question.data)
}

router.post('/:id/questions',
  authorize(),
  param('projectId'),
  validate(SaveRuleQuestionRequest),
  async (req, res) => {
    await saveQuestion(res, res.locals.id, req.body, null)
  }
)

router.put('/:id/questions/:questionId',
  authorize(),
  param('projectId'),
  validate(SaveRuleQuestionRequest),
  async (req, res) => {
    const question = await findQuestion(res.locals.id, req.params.questionId)
    if (!question) {
      return res.sendStatus(404)
    }
    await saveQuestion(res, res.locals.id, req.body, question)
  }
)

router.delete('/:id/questions/:questionId',
  authorize(),
  param('projectId'),
  async (req, res) => {
    const question = await findQuestion(res.locals.id, req.params.questionId)
    if (!question) {
      return res.sendStatus(404)
    }
    const rules = (await RuleQuestionModel.usage(res.locals.id))[question.id]
    if (rules) {
      return res.status(400).send({ message: `The question is used by the rules: ${rules.join(', ')}.` })
    }
    await RuleQuestionModel.delete(question.id)
    log(`Deleted ${question} '${question.name}' of project #${res.locals.id}.`)
    res.sendStatus(204)
  }
)

router.get('/:id',
  authorize(),
  param('projectId'),
  async (req, res) => {
    const plans = await FlowPlanModel.findForProject(res.locals.id)
    res.send({ ...res.locals.project.data, plans: plans.map(plan => plan.data) })
  }
)

export default router
