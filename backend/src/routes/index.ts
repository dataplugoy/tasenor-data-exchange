import express from 'express'
import authRoute from './auth'
import projectsRoute from './projects'
import flowPlanRoute from './flow-plans'
import batchRoute from './batches'
import outputDestinationRoute from './output-destinations'
import questionsRoute from './questions'
import runRoute from './runs'

const router: express.Router = express.Router()

router.use('/auth', authRoute)
router.use('/batches', batchRoute)
router.use('/flow-plans', flowPlanRoute)
router.use('/output-destinations', outputDestinationRoute)
router.use('/projects', projectsRoute)
router.use('/questions', questionsRoute)
router.use('/runs', runRoute)

export default router
