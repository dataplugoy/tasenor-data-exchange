import express from 'express'
import { authorize } from '../lib/authorize'
import { param } from '../lib/param'

const router = express.Router()

router.get('/:id',
  authorize(),
  param('runId'),
  async (_req, res) => {
    res.send({ ...res.locals.run.data })
  }
)

export default router
