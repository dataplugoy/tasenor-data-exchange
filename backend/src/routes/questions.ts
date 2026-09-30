import express from 'express'
import { authorize } from '../lib/authorize'
import { VARIABLES } from '../exceptions/AnswersRequired'

const router: express.Router = express.Router()

router.get('/',
  authorize(),
  async (_req, res) => {
    res.send(Object.values(VARIABLES))
  }
)

export default router
