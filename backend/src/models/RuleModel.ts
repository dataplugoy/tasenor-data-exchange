import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { log } from '@tasenor/common'

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
    return Object.keys(rules).reduce((prev, cur) => prev + Object.keys(rules[cur]).length, 0)
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
   * Get the rules for the flow in the order of evaluation.
   * @param flow
   * @returns
   */
  static async findForFlow(flowPlanId: number, ruleFile: string | null = null): Promise<RuleModel[]> {
    if (ruleFile) {
      await this.syncDriverRules(flowPlanId, ruleFile)
    }
    return this.findMany<prisma.Rule, RuleModel>({ flowPlanId }, [{ priority: 'desc' }, { id: 'asc' }])
  }

  /**
   * Update the driver defaults of the flow from the driver rule file, if the file has changed since last time.
   *
   * Only rules having origin `DRIVER` are created, updated or removed. Rules of the user are never touched and
   * a driver rule is not added, if the user has a rule of the same name.
   */
  private static async syncDriverRules(flowPlanId: number, ruleFile: string): Promise<void> {
    const content = fs.readFileSync(path.join(__dirname, '..', 'driver', 'rules', ruleFile), 'utf-8')
    const hash = crypto.createHash('sha1').update(content).digest('hex')
    const flow = await BaseModel.prismaClient.flowPlan.findUnique({ where: { id: flowPlanId }, select: { ruleSourceHash: true } })
    if (!flow || flow.ruleSourceHash === hash) {
      return
    }

    log(`Synchronizing driver rules from ${ruleFile} for flow plan #${flowPlanId}.`)
    const rulesData: Partial<prisma.Rule>[] = JSON.parse(content)
    const existing: Record<string, RuleModel> = {}
    for (const rule of await this.findMany<prisma.Rule, RuleModel>({ flowPlanId })) {
      existing[rule.name] = rule
    }

    const names = new Set<string>()
    for (const ruleItem of rulesData) {
      const name = ruleItem.name as string
      names.add(name)
      const old = existing[name]
      if (!old) {
        const rule = await RuleModel.save({
          filterView: {},
          resultView: {},
          ...ruleItem,
          origin: 'DRIVER',
          flowPlanId,
        })
        log(`  Created ${rule} called '${name}' for flow plan #${flowPlanId}.`)
      } else if (old.data.origin === 'DRIVER' && !RuleModel.sameDefinition(old.data, ruleItem)) {
        await RuleModel.update<prisma.Rule, RuleModel>(old, {
          filter: ruleItem.filter,
          key: ruleItem.key ?? '',
          result: ruleItem.result,
        })
        log(`  Updated ${old} called '${name}' for flow plan #${flowPlanId}.`)
      }
    }

    for (const rule of Object.values(existing)) {
      if (rule.data.origin === 'DRIVER' && !names.has(rule.name)) {
        log(`  Removed ${rule} called '${rule.name}' no longer in the driver rules.`)
        await RuleModel.delete(rule.id)
      }
    }

    await BaseModel.prismaClient.flowPlan.update({ where: { id: flowPlanId }, data: { ruleSourceHash: hash } })
  }

  /**
   * Check if the rule has the same filter, key and result as the given definition.
   */
  static sameDefinition(rule: Partial<prisma.Rule>, def: Partial<prisma.Rule>): boolean {
    return JSON.stringify(rule.filter) === JSON.stringify(def.filter) &&
      (rule.key || '') === (def.key || '') &&
      JSON.stringify(rule.result) === JSON.stringify(def.result)
  }

  /**
   * Record that this rule matched an input item.
   */
  static async recordMatch(id: number): Promise<void> {
    await RuleModel.db.update({ where: { id }, data: { matchCount: { increment: 1 }, lastMatched: new Date() } })
  }

  /**
   * Get the rules for the flow sorted by the key.
   * @param flow
   * @returns
   */
  static async findForFlowByKey(flowId: number, ruleFile: string): Promise<Record<string, RuleModel[]>> {
    const byKey: Record<string, RuleModel[]> = {}
    const rules = await this.findForFlow(flowId, ruleFile)

    for (const rule of rules.filter(rule => rule.data.enabled !== false)) {
      const key = rule.data.key || ''
      if (!byKey[key]) {
        byKey[key] = []
      }
      byKey[key].push(rule)
    }

    return byKey
  }
}
