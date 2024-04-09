import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { FlowPlanModel } from './FlowPlanModel'
import { Constructor } from '@tasenor/common'
import { Driver } from '../engine/driver/Driver'
import { TestMockDriver } from '../engine/driver/TestMockDriver'
import { EnableBankingDriver } from '../engine/driver/EnableBankingDriver'

export class InputSourceModel extends BaseModel<prisma.InputSource> {

  static table = 'inputSource'
  static construct = InputSourceModel

  /**
   * Drivers implemented.
   */
  private static drivers: Record<prisma.DriverType, Constructor<Driver>> = {
    TEST_MOCK: TestMockDriver,
    ENABLE_BANKING: EnableBankingDriver,
  }

  get type(): prisma.DriverType {
    return this.data.type
  }

  /**
   * Get the driver for this input source.
   */
  getDriver(): Driver {
    const Driver = InputSourceModel.drivers[this.type]
    if (!Driver) {
      throw new Error(`Cannot find driver for input source type '${this.type}'.`)
    }
    return new Driver(this.data.settings)
  }

  /**
   * Get the input source information for a flow.
   * @param flow
   * @returns
   */
  static async findForFlow(flow: FlowPlanModel): Promise<InputSourceModel | null> {
    const source = await this.findUnique<prisma.InputSource, InputSourceModel>({ flowPlanId: flow.id })
    return source
  }
}
