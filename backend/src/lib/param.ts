import { error } from '@tasenor/common'
import { FlowPlanModel } from '../models/FlowPlanModel'
import { ProjectModel } from '../models/ProjectModel'
import { OutputDestinationModel } from '../models/OutputDestinationModel'

/**
 * A middleware checking for proper id parameter.
 * @returns ID checker middleware function.
 */
export const param = (what: 'id' | 'flowPlanId' | 'projectId' | 'outputDestinationId') => {
  return async (req, res, next) => {
    const id = `${req.params.id}`

    if (!/^[0-9]+$/.test(id)) {
      return res.sendStatus(400)
    }

    res.locals.id = parseInt(id)

    switch (what) {
      case 'flowPlanId':
        res.locals.flowPlan = await FlowPlanModel.get(res.locals.id)
        res.locals.project = res.locals.flowPlan && await ProjectModel.get(res.locals.flowPlan.data.projectId)
        if (!res.locals.project || res.locals.project.data.userId !== res.locals.userId) {
          return res.sendStatus(404)
        }
        return next()

      case 'projectId':
        res.locals.project = await ProjectModel.get(res.locals.id)
        if (!res.locals.project || res.locals.project.data.userId !== res.locals.userId) {
          return res.sendStatus(404)
        }
        return next()

      case 'outputDestinationId':
        res.locals.outputDestination = await OutputDestinationModel.get(res.locals.id)
        res.locals.flowPlan = res.locals.outputDestination && await FlowPlanModel.get(res.locals.outputDestination.data.flowPlanId)
        res.locals.project = res.locals.flowPlan && await ProjectModel.get(res.locals.flowPlan.data.projectId)
        if (!res.locals.project || res.locals.project.data.userId !== res.locals.userId) {
          return res.sendStatus(404)
        }
        return next()
    }

    error(`Don't know how to handle parameter ${what}.`)

    return res.sendStatus(400)
  }
}
