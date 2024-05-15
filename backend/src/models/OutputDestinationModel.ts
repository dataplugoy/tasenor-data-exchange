import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { Driver } from '../driver/Driver'
import { getDriver } from '../driver'
import { DriverSettings } from '../types/DriverSettings'
import { ProjectSettings } from '../types/API/Project'
import { Setup } from '../types/API/Setup'

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
    return getDriver(this.type, this.data.settings as DriverSettings, settings, setup)
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
    Object.assign(this.data.settings as object, patch)
    await OutputDestinationModel.update<prisma.OutputDestination, OutputDestinationModel>(this, { settings: this.data.settings })
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
    return OutputDestinationModel.create<prisma.OutputDestination, OutputDestinationModel>(data)
  }

  static async get(id: number): Promise<OutputDestinationModel | null> {
    return this.findUnique<prisma.OutputDestination, OutputDestinationModel>({ id })
  }
}
