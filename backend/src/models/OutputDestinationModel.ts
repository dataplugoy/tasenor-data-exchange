import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { Driver } from '../driver/Driver'
import { getDriver } from '../driver'
import { DriverSettings } from '../types/DriverSettings'

export class OutputDestinationModel extends BaseModel<prisma.OutputDestination> {

  static table = 'outputDestination'
  static construct = OutputDestinationModel

  get type(): prisma.DriverType {
    return this.data.type
  }

  /**
   * Get the driver for this input source.
   */
  getDriver(): Driver {
    return getDriver(this.type, this.data.settings as DriverSettings)
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
}
