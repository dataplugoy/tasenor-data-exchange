import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { FlowPlanModel } from './FlowPlanModel'
import { Constructor } from '@tasenor/common'
import { TestMockDriver } from '../engine/driver/TestMockDriver'
import { EnableBankingDriver } from '../engine/driver/EnableBankingDriver'
import { Driver } from '../engine/driver/Driver'

export class OutputDestinationModel extends BaseModel<prisma.OutputDestination> {

  static table = 'outputDestination'
  static construct = OutputDestinationModel

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

  // TODO: This should be moved to Driver class.
  /**
   * Get the driver for this input source.
   */
  getDriver(): Driver {
    const Driver = OutputDestinationModel.drivers[this.type]
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
  static async findForFlow(flow: FlowPlanModel): Promise<OutputDestinationModel | null> {
    const source = await this.findUnique<prisma.OutputDestination, OutputDestinationModel>({ flowPlanId: flow.id })
    return source
  }
}
