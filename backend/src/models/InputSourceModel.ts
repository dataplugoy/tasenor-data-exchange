import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { Driver } from '../driver/Driver'
import { DriverSettings } from '../types/DriverSettings'
import { getDriver } from '../driver'

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

  static async save(data: Partial<prisma.InputSource>): Promise<InputSourceModel> {
    // TODO: Handle if id != null.
    return InputSourceModel.create<prisma.InputSource, InputSourceModel>(data)
  }
}
