import { error } from '@tasenor/common'

/**
 * IDs of flow plans having a run in progress.
 */
export const runningFlowPlans: Set<number> = new Set()

/**
 * A middleware refusing to start a run for a flow plan that is already running.
 * The flow plan is reserved until the run finishes or the request ends without running.
 */
export function exclusiveRun() {
  return (req, res, next) => {
    const id = res.locals.flowPlan.id
    if (runningFlowPlans.has(id)) {
      error(`${res.locals.flowPlan} is already running.`)
      return res.status(409).send({ message: 'The flow plan is already running.' })
    }
    runningFlowPlans.add(id)
    res.on('close', () => {
      if (!res.locals.runStarted) {
        runningFlowPlans.delete(id)
      }
    })
    next()
  }
}

/**
 * A middleware refusing to change the batches of a flow plan that is running, since the run is writing to them.
 */
export function notRunning() {
  return (req, res, next) => {
    if (runningFlowPlans.has(res.locals.flowPlan.id)) {
      error(`${res.locals.flowPlan} is running.`)
      return res.status(409).send({ message: 'The flow plan is already running.' })
    }
    next()
  }
}
