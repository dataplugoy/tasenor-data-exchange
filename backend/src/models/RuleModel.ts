import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { FlowPlanModel } from './FlowPlanModel'
import { InputSourceModel } from './InputSourceModel'

export class RuleModel extends BaseModel<prisma.Rule> {

  static table = 'rule'
  static construct = RuleModel

  get filter(): string {
    return this.data.filter as string
  }

  get result(): string {
    return this.data.result as string
  }

  /**
   * Count total number of rules in the rule collection.
   * @param rules
   */
  static count(rules: Record<string, RuleModel[]>): number {
    return Object.keys(rules).reduce((prev, cur) => prev + Object.keys(cur).length, 0)
  }

  /**
   * Save item to the DB.
   * @param data
   * @returns
   */
  static async save(data: Partial<prisma.InputItem>): Promise<RuleModel> {
    return RuleModel.create<prisma.Rule, RuleModel>(data)
  }

  /**
   * Get the rules for the flow.
   * @param flow
   * @returns
   */
  static async findForFlow(flowId: number): Promise<RuleModel[]> {
    const source = await InputSourceModel.findForFlow(flowId)
    if (!source) {
      throw new Error(`Cannot find input source for flow ${flowId}.`)
    }
    const sourceRules = await this.findMany<prisma.Rule, RuleModel>({ ownerId: source.id, type: 'INPUT_SOURCE' }, [{ priority: 'desc' }])
    const flowRules = await this.findMany<prisma.Rule, RuleModel>({ ownerId: flowId, type: 'FLOW' }, [{ priority: 'desc' }])
    return sourceRules.concat(flowRules)
  }

  /**
   * Get the rules for the flow sorted by the key.
   * @param flow
   * @returns
   */
  static async findForFlowByKey(flowId: number): Promise<Record<string, RuleModel[]>> {
    const byKey: Record<string, RuleModel[]> = {}
    const rules = await this.findForFlow(flowId)

    for (const rule of rules) {
      if (!byKey[rule.data.key]) {
        byKey[rule.data.key] = []
      }
      byKey[rule.data.key].push(rule)
    }

    return byKey
  }
}
