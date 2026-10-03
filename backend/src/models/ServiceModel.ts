import { getService } from '../lib/services'
import { Service } from '../lib/services/Service'
import { ServiceSettings } from '../types/ServiceSettings'
import { Service as ServiceData } from '../types/API/Service'
import { SaveServiceRequest } from '../types/API/services/SaveServiceRequest'
import { BaseModel } from './BaseModel'
import { decryptSecrets, encryptSecret, encryptSecrets, hasPlainSecrets } from '../lib/secrets'
import prisma from '@prisma/client'

export class ServiceModel extends BaseModel<prisma.Service> {

  static table = 'service'
  static construct = ServiceModel

  getService(): Service {
    return getService(this.data.driver, decryptSecrets(this.data.settings as unknown as ServiceSettings, `${this}`))
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
      available: this.getService().getCababilities(),
      capabilities: this.getService().getEnabledCapabilities(),
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
        settings[secret] = encryptSecret(`${value}`)
      }
    }
    const available = getService(request.driver, settings).getCababilities()
    if (request.capabilities) {
      const unknown = request.capabilities.filter(c => !available.includes(c))
      if (unknown.length) {
        throw new Error(`Service ${request.driver} does not provide ${unknown.join(', ')}.`)
      }
      if (!request.capabilities.length) {
        throw new Error('At least one capability must be in use.')
      }
      if (request.capabilities.length < available.length) {
        settings.capabilities = available.filter(c => request.capabilities?.includes(c))
      }
    }
    const capabilities = settings.capabilities || available
    return {
      name: request.name,
      driver: request.driver,
      free: !!request.free,
      type: capabilities[0],
      settings: settings as unknown as prisma.Prisma.JsonObject,
    }
  }

  /**
   * Encrypt secrets saved before encryption was used.
   * @returns Number of services updated.
   */
  static async encryptStoredSecrets(): Promise<number> {
    let count = 0
    for (const service of await this.findMany<prisma.Service, ServiceModel>({})) {
      if (hasPlainSecrets(service.data.settings)) {
        service.data.settings = encryptSecrets(service.data.settings as object) as prisma.Prisma.JsonObject
        await ServiceModel.update<prisma.Service, ServiceModel>(service, { settings: service.data.settings })
        count++
      }
    }
    return count
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
