import path from 'path'
import fs from 'fs'
import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { InputSourceModel } from './InputSourceModel'
import { log } from '@tasenor/common'
import { JsonObject, JsonValue } from '@prisma/client/runtime/library'

export class RuleModel extends BaseModel<prisma.Rule> {

  static table = 'rule'
  static construct = RuleModel

  get filter(): string {
    return this.data.filter as string
  }

  get result(): string {
    return this.data.result as string
  }

  get name(): string {
    return this.data.name
  }

  /**
   * Delete this and everything related.
   */
  async destroy(): Promise<void> {
    await RuleModel.delete(this.id)
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
  static async save(data: RuleModel | Partial<prisma.Rule>): Promise<RuleModel> {
    if (data instanceof RuleModel) {
      await RuleModel.update<prisma.Rule, RuleModel>(data, data.data)
      return data
    }
    return RuleModel.create<prisma.Rule, RuleModel>(data)
  }

  /**
   * Get the rules for the flow.
   * @param flow
   * @returns
   */
  static async findForFlow(flowPlanId: number, ruleFile: string): Promise<RuleModel[]> {
    const source = await InputSourceModel.findForFlow(flowPlanId)
    if (!source) {
      throw new Error(`Cannot find input source for flow ${flowPlanId}.`)
    }
    const sourceRules = await this.refreshRules(flowPlanId, source, ruleFile)
    const flowRules = await this.findMany<prisma.Rule, RuleModel>({ ownerId: flowPlanId, type: 'FLOW' }, [{ priority: 'desc' }])

    return sourceRules.concat(flowRules)
  }

  /**
   * Load rules to the database.
   */
  private static async refreshRules(flowPlanId: number, source: InputSourceModel, ruleFile: string): Promise<RuleModel[]> {

    const sourceRules = await this.findMany<prisma.Rule, RuleModel>({ ownerId: source.id, type: 'INPUT_SOURCE' }, [{ priority: 'desc' }])

    const rulePath = path.join(__dirname, '..', 'driver', 'rules', ruleFile)

    // Delete old if file changed.
    if (sourceRules.length) {

      const fd = fs.openSync(rulePath, 'r')
      const lastModified = fs.fstatSync(fd).mtime
      fs.closeSync(fd)

      if (lastModified > sourceRules[0].data.created) {
        for (const rule of sourceRules) {
          log(`Time stamp changed. Removing old rule ${rule}.`)
          await RuleModel.delete(rule.id)
        }
      } else {
        return sourceRules
      }
    }

    const rulesData = JSON.parse(fs.readFileSync(rulePath, 'utf-8'))
    const rules: RuleModel[] = []

    log(`Initializing rules for ${source}.`)

    for (const ruleItem of rulesData) {
      const rule = await RuleModel.save({
        filterView: {},
        resultView: {},
        ...ruleItem,
        type: 'INPUT_SOURCE',
        ownerId: source?.id
      })
      log(`Created ${rule} called '${ruleItem.name}' for flow plan #${flowPlanId}.`)

      rules.push(rule)
    }

    return rules
  }

  /**
   * Get the rules for the flow sorted by the key.
   * @param flow
   * @returns
   */
  static async findForFlowByKey(flowId: number, ruleFile: string): Promise<Record<string, RuleModel[]>> {
    const byKey: Record<string, RuleModel[]> = {}
    const rules = await this.findForFlow(flowId, ruleFile)

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
