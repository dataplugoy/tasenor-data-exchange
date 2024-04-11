import express from 'express'
import authRoute from './auth'
import projectsRoute from './projects'
import flowPlanRoute from './flow-plans'
import batchRoute from './batches'

const router = express.Router()

router.use('/auth', authRoute)
router.use('/batches', batchRoute)
router.use('/flow-plans', flowPlanRoute)
router.use('/projects', projectsRoute)

export default router
