import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { FlowPlanModel } from './FlowPlanModel'
import { InputSourceModel } from './InputSourceModel'

export class RuleModel extends BaseModel<prisma.Rule> {

  static table = 'rule'
  static construct = RuleModel

  /**
   * Get the input items for the batch.
   * @param flow
   * @returns
   */
  static async findForFlow(flow: FlowPlanModel): Promise<RuleModel[]> {
    const source = await InputSourceModel.findForFlow(flow)
    if (!source) {
      throw new Error(`Cannot find input source for flow ${flow}.`)
    }
    const sourceRules = await this.findMany<prisma.Rule, RuleModel>({ ownerId: source.id, type: 'INPUT_SOURCE' })
    const flowRules = await this.findMany<prisma.Rule, RuleModel>({ ownerId: flow.id, type: 'FLOW' })
    return sourceRules.concat(flowRules)
  }
}
