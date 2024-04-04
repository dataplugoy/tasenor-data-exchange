import express from 'express'

const router = express.Router()

router.post('/', async (req, res) => {
  console.log(req.body)
  res.status(401).send({ message: 'Invalid user or password.' })
})

export default router
