import express from 'express'
import { authorize } from '../lib/authorize'

const router = express.Router()


/**
 * List of all projects for user.
 */
router.get('/',
  authorize(),
  async (req, res) => {
    const userId = res.locals.id
    res.send(['TODO: projects for user', userId])
  }
)

export default router
