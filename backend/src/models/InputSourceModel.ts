import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { FlowPlanModel } from './FlowPlanModel'
import { Constructor } from '@tasenor/common'
import { InputSource } from '../engine/source/InputSource'
import { TestMockInput } from '../engine/source/TestMockInput'
import { EnableBankingInput } from '../engine/source/EnableBankingInput'

export class InputSourceModel extends BaseModel<prisma.InputSource> {

  static table = 'inputSource'
  static construct = InputSourceModel

  /**
   * Drivers implemented.
   */
  private static drivers: Record<prisma.InputSourceType, Constructor<InputSource>> = {
    TEST_MOCK_INPUT: TestMockInput,
    ENABLE_BANKING: EnableBankingInput,
  }

  get type(): prisma.InputSourceType {
    return this.data.type
  }

  /**
   * Get the driver for this input source.
   */
  getDriver(): InputSource {
    const driver = InputSourceModel.drivers[this.type]
    if (!driver) {
      throw new Error(`Cannot find driver for input source type '${this.type}'.`)
    }
    return new driver(this.data.settings)
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
