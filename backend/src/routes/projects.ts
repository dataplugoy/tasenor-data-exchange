import express from 'express'
import { authorize } from '../lib/authorize'
import { ProjectModel } from '../models/ProjectModel'

const router = express.Router()


/**
 * List of all projects for user.
 */
router.get('/',
  authorize(),
  async (req, res) => {
    const userId = res.locals.id
    const projects = await ProjectModel.findForUser(userId)
    res.send(projects.map(project => project.data))
  }
)

export default router
