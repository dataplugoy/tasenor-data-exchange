import { error } from '@tasenor/common'
import { FlowPlanModel } from '../models/FlowPlanModel'
import { ProjectModel } from '../models/ProjectModel'
import { OutputDestinationModel } from '../models/OutputDestinationModel'
import { BatchModel } from '../models/BatchModel'
import { RunModel } from '../models/RunModel'
import { ServiceModel } from '../models/ServiceModel'

/**
 * A middleware checking for proper id parameter.
 * @returns ID checker middleware function.
 */
export const param = (what: 'runId' | 'batchId' | 'flowPlanId' | 'projectId' | 'outputDestinationId' | 'serviceId') => {
  return async (req, res, next) => {
    const id = `${req.params.id}`

    if (!/^[0-9]+$/.test(id)) {
      return res.sendStatus(400)
    }

    res.locals.id = parseInt(id)

    switch (what) {
      case 'runId':
        res.locals.run = await RunModel.get(res.locals.id)
        res.locals.batch = res.locals.run && await BatchModel.get(res.locals.run.data.batchId)
        res.locals.flowPlan = res.locals.batch && await FlowPlanModel.get(res.locals.batch.data.flowPlanId)
        res.locals.project = res.locals.flowPlan && await ProjectModel.get(res.locals.flowPlan.data.projectId)
        if (!res.locals.project || res.locals.project.data.userId !== res.locals.userId) {
          return res.sendStatus(404)
        }
        return next()

      case 'batchId':
        res.locals.batch = await BatchModel.get(res.locals.id)
        res.locals.flowPlan = res.locals.batch && await FlowPlanModel.get(res.locals.batch.data.flowPlanId)
        res.locals.project = res.locals.flowPlan && await ProjectModel.get(res.locals.flowPlan.data.projectId)
        if (!res.locals.project || res.locals.project.data.userId !== res.locals.userId) {
          return res.sendStatus(404)
        }
        return next()

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

      case 'serviceId':
        res.locals.service = await ServiceModel.get(res.locals.id)
        if (!res.locals.service || res.locals.service.data.userId !== res.locals.userId) {
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
