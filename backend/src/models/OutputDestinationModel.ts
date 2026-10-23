import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { Driver } from '../driver/Driver'
import { getDriver } from '../driver'
import { DriverSettings } from '../types/DriverSettings'
import { ProjectSettings } from '../types/API/Project'
import { Setup } from '../types/API/Setup'
import { decryptSecrets, encryptSecrets, hasPlainSecrets } from '../lib/secrets'

export class OutputDestinationModel extends BaseModel<prisma.OutputDestination> {

  static table = 'outputDestination'
  static construct = OutputDestinationModel

  get type(): prisma.DriverType {
    return this.data.type
  }

  /**
   * Get the driver for this input source.
   */
  getDriver(settings: ProjectSettings, setup: Setup): Driver {
    return getDriver(this.type, decryptSecrets(this.data.settings as DriverSettings, `${this}`), settings, setup)
  }

  /**
   * Delete this and everything related.
   */
  async destroy(): Promise<void> {
    await OutputDestinationModel.delete(this.id)
  }

  /**
   * Change settings.
   * @param patch
   */
  async updateSettings(patch: Record<string, unknown>): Promise<void> {
    Object.assign(this.data.settings as object, encryptSecrets(patch))
    await OutputDestinationModel.update<prisma.OutputDestination, OutputDestinationModel>(this, { settings: this.data.settings })
    // The state of the plan may have a login token of the old settings, like another user or host.
    await BaseModel.prismaClient.flowPlan.update({ where: { id: this.data.flowPlanId }, data: { state: {} } })
  }

  /**
   * Get the input source information for a flow.
   * @param flow
   * @returns
   */
  static async findForFlow(flowPlanId: number): Promise<OutputDestinationModel | null> {
    const source = await this.findUnique<prisma.OutputDestination, OutputDestinationModel>({ flowPlanId })
    return source
  }

  static async save(data: Partial<prisma.OutputDestination>): Promise<OutputDestinationModel> {
    if (data.id) {
      throw new Error('A function save() cannot be used to existing object.')
    }
    return OutputDestinationModel.create<prisma.OutputDestination, OutputDestinationModel>({ ...data, settings: encryptSecrets(data.settings || {}) })
  }

  static async get(id: number): Promise<OutputDestinationModel | null> {
    return this.findUnique<prisma.OutputDestination, OutputDestinationModel>({ id })
  }

  /**
   * Encrypt secrets saved before encryption was used.
   * @returns Number of destinations updated.
   */
  static async encryptStoredSecrets(): Promise<number> {
    let count = 0
    for (const dest of await this.findMany<prisma.OutputDestination, OutputDestinationModel>({})) {
      if (hasPlainSecrets(dest.data.settings)) {
        dest.data.settings = encryptSecrets(dest.data.settings as object) as prisma.Prisma.JsonObject
        await OutputDestinationModel.update<prisma.OutputDestination, OutputDestinationModel>(dest, { settings: dest.data.settings })
        count++
      }
    }
    return count
  }
}
