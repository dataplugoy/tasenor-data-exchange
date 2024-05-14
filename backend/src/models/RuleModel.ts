import path from 'path'
import fs from 'fs'
import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { InputSourceModel } from './InputSourceModel'
import { log } from '@tasenor/common'
import { Driver } from '../driver/Driver'

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
  static async findForFlow(flowPlanId: number, driver: Driver): Promise<RuleModel[]> {
    const source = await InputSourceModel.findForFlow(flowPlanId)
    if (!source) {
      throw new Error(`Cannot find input source for flow ${flowPlanId}.`)
    }
    let sourceRules = await this.findMany<prisma.Rule, RuleModel>({ ownerId: source.id, type: 'INPUT_SOURCE' }, [{ priority: 'desc' }])
    if (sourceRules.length === 0) {
      this.initializeRules(flowPlanId, source, driver)
    }
    const flowRules = await this.findMany<prisma.Rule, RuleModel>({ ownerId: flowPlanId, type: 'FLOW' }, [{ priority: 'desc' }])

    return sourceRules.concat(flowRules)
  }

  /**
   * Load rules to the database.
   */
  private static async initializeRules(flowPlanId: number, source: InputSourceModel, driver: Driver): Promise<Record<string, RuleModel[]>> {
    log(`Initializing rules for ${source}.`)

    const rulePath = path.join(__dirname, '..', 'driver', 'rules', `${driver.constructor.name}.json`)
    const rulesData = JSON.parse(fs.readFileSync(rulePath, 'utf-8'))
    const rules: Record<string, RuleModel[]> = {}

    for (const ruleItem of rulesData) {
      const key = ruleItem.key || ''
      if (!rules[key]) {
        rules[key] = []
      }

      const rule = await RuleModel.save({
        filterView: {},
        resultView: {},
        ...ruleItem,
        type: 'INPUT_SOURCE',
        ownerId: source?.id
      })
      log(`Created ${rule} called '${ruleItem.name}' for flow plan #${flowPlanId}.`)

      rules[key].push(rule)
    }

    return rules
  }

  /**
   * Get the rules for the flow sorted by the key.
   * @param flow
   * @returns
   */
  static async findForFlowByKey(flowId: number, driver: Driver): Promise<Record<string, RuleModel[]>> {
    const byKey: Record<string, RuleModel[]> = {}
    const rules = await this.findForFlow(flowId, driver)

    for (const rule of rules) {
      const key = rule.data.key || ''
      if (!byKey[key]) {
        byKey[key] = []
      }
      byKey[key].push(rule)
    }

    return byKey
  }
}
