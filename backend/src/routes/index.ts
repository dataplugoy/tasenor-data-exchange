import express from 'express'
import authRoute from './auth'
import projectsRoute from './projects'

const router = express.Router()

router.use('/auth', authRoute)
router.use('/projects', projectsRoute)

export default router
