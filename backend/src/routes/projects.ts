import express from 'express'
import { authorize } from '../lib/authorize'
import { ProjectModel } from '../models/ProjectModel'
import { FlowPlanModel } from '../models/FlowPlanModel'
import { param } from '../lib/param'
import { OutputItemModel } from '../models/OutputItemModel'

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

router.get('/:id',
  authorize(),
  param('projectId'),
  async (req, res) => {
    const plans = await FlowPlanModel.findForProject(res.locals.id)
    res.send({ ...res.locals.project.data, plans: plans.map(plan => plan.data) })
  }
)

export default router
