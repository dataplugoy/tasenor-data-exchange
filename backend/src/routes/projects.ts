import express from 'express'
import { authorize } from '../lib/authorize'
import { ProjectModel } from '../models/ProjectModel'
import { FlowPlanModel } from '../models/FlowPlanModel'
import { param } from '../lib/param'

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
    res.send({...project.data, plans: plans.map(plan => plan.data) })
  }
)

export default router
