import express from 'express'
import authRoute from './auth'
import projectsRoute from './projects'
import flowPlanRoute from './flow-plan'

const router = express.Router()

router.use('/auth', authRoute)
router.use('/projects', projectsRoute)
router.use('/flow-plans', flowPlanRoute)

export default router
