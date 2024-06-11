import express from 'express'
import authRoute from './auth'
import projectsRoute from './projects'
import flowPlanRoute from './flow-plans'
import batchRoute from './batches'
import outputDestinationRoute from './output-destinations'
import questionsRoute from './questions'

const router = express.Router()

router.use('/auth', authRoute)
router.use('/batches', batchRoute)
router.use('/flow-plans', flowPlanRoute)
router.use('/output-destinations', outputDestinationRoute)
router.use('/projects', projectsRoute)
router.use('/questions', questionsRoute)

export default router
