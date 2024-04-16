import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { ProjectModel } from './ProjectModel'
import { FlowPlanModel } from './FlowPlanModel'

export class ServiceModel extends BaseModel<prisma.Service> {

  static table = 'service'
  static construct = ServiceModel

  /**
   * Get a list of all services the user has.
   */
  static async findForUser(userId: number): Promise<ServiceModel[]> {
    return this.findMany<prisma.Service, ServiceModel>({ userId })
  }
}
