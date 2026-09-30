import { getService } from '../lib/services'
import { Service } from '../lib/services/Service'
import { ServiceSettings } from '../types/ServiceSettings'
import { Service as ServiceData } from '../types/API/Service'
import { SaveServiceRequest } from '../types/API/services/SaveServiceRequest'
import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'

export class ServiceModel extends BaseModel<prisma.Service> {

  static table = 'service'
  static construct = ServiceModel

  getService(): Service {
    return getService(this.data.driver, this.data.settings as unknown as ServiceSettings)
  }

  /**
   * Presentation for the API. Secrets are never included, only whether they are set.
   */
  toResponse(): ServiceData {
    const settings = this.data.settings as unknown as ServiceSettings
    return {
      id: this.data.id,
      name: this.data.name,
      driver: this.data.driver,
      capabilities: this.getService().getCababilities(),
      free: this.data.free,
      url: settings.url || '',
      user: settings.user || '',
      hasPassword: !!settings.password,
      hasKey: !!settings.key,
    }
  }

  /**
   * Construct the data of a service from a request. A missing password or key keeps the old one and an empty one
   * removes it.
   * @param request
   * @param old Previous settings, if updating.
   */
  static fromRequest(request: SaveServiceRequest, old: ServiceSettings | null = null): Pick<prisma.Service, 'name' | 'driver' | 'free' | 'type' | 'settings'> {
    const settings: ServiceSettings = { url: request.url }
    if (request.user) {
      settings.user = request.user
    }
    for (const secret of ['password', 'key'] as const) {
      const value = request[secret] === undefined ? old?.[secret] : request[secret]
      if (value) {
        settings[secret] = `${value}`
      }
    }
    const capabilities = getService(request.driver, settings).getCababilities()
    return {
      name: request.name,
      driver: request.driver,
      free: !!request.free,
      type: capabilities[0],
      settings: settings as unknown as prisma.Prisma.JsonObject,
    }
  }

  static async get(id: number): Promise<ServiceModel | null> {
    return this.findUnique<prisma.Service, ServiceModel>({ id })
  }

  /**
   * Get a list of all free services.
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
