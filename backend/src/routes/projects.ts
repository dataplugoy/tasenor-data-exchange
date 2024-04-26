import express from 'express'
import { authorize } from '../lib/authorize'
import { ProjectModel } from '../models/ProjectModel'
import { FlowPlanModel } from '../models/FlowPlanModel'
import { param } from '../lib/param'
import { OutputItemModel } from '../models/OutputItemModel'

const router = express.Router()

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
  param('id'),
  async (req, res) => {
    // TODO: DRY. Should have one verification done by project fetch middleware.
    const userId = res.locals.userId
    const projectId = res.locals.id
    const project = await ProjectModel.get(projectId)
    if (!project || project.data.userId !== userId) {
      return res.sendStatus(404)
    }
    const plans = await FlowPlanModel.findForProject(projectId)
    const items = await OutputItemModel.getAll({ delivered: true, flowPlanId: { in: plans.map(plan => plan.id) } }, [{ created: 'desc' }])
    res.send(items.map(item => item.data))
  }
)

router.get('/:id',
  authorize(),
  param('id'),
  async (req, res) => {
    const userId = res.locals.userId
    const projectId = res.locals.id
    const project = await ProjectModel.get(projectId)
    if (!project || project.data.userId !== userId) {
      return res.sendStatus(404)
    }
    const plans = await FlowPlanModel.findForProject(projectId)
    res.send({ ...project.data, plans: plans.map(plan => plan.data) })
  }
)

export default router
