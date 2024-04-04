import express from 'express'

const router = express.Router()

/**
 * List of all projects for user.
 */
router.get('/',
  // TODO: Authorize.
  async (req, res) => {
    res.send([])
  }
)

export default router
