import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { FlowPlanModel } from './FlowPlanModel'
import { Driver } from '../engine/driver/Driver'
import { getDriver } from '../engine/driver'
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
  static async findForFlow(flow: FlowPlanModel): Promise<OutputDestinationModel | null> {
    const source = await this.findUnique<prisma.OutputDestination, OutputDestinationModel>({ flowPlanId: flow.id })
    return source
  }
}
