import { getService } from '../lib/services'
import { Service } from '../lib/services/Service'
import { ServiceSettings } from '../types/ServiceSettings'
import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'

export class ServiceModel extends BaseModel<prisma.Service> {

  static table = 'service'
  static construct = ServiceModel

  getService(): Service {
    return getService(this.data.driver, this.data.settings as unknown as ServiceSettings)
  }

  /**
   * Get a list of all services the user has.
   */
  static async findAllFree(): Promise<ServiceModel[]> {
    return this.findMany<prisma.Service, ServiceModel>({ free: true })
  }

  /**
   * Get a list of all services the user has.
   */
  static async findForUser(userId: number): Promise<ServiceModel[]> {
    return this.findMany<prisma.Service, ServiceModel>({ userId })
  }
}
