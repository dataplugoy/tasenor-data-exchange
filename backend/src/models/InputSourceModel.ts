import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { FlowPlanModel } from './FlowPlanModel'
import { Driver } from '../engine/driver/Driver'
import { DriverSettings } from '../types/DriverSettings'
import { getDriver } from '../engine/driver'

export class InputSourceModel extends BaseModel<prisma.InputSource> {

  static table = 'inputSource'
  static construct = InputSourceModel

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
  static async findForFlow(flowPlanId: number): Promise<InputSourceModel | null> {
    const source = await this.findUnique<prisma.InputSource, InputSourceModel>({ flowPlanId })
    return source
  }
}
