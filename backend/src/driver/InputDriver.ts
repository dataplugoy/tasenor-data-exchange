import hash from 'object-hash'
import { isShortDate } from '@tasenor/common'
import { BatchModel } from '../models/BatchModel'
import { InputItemModel } from '../models/InputItemModel'
import { FlowPlanModel } from '../models/FlowPlanModel'
import { RuleModel } from '../models/RuleModel'
import { applyRules } from '../lib/rules'
import { RunModel } from '../models/RunModel'
import { DateTime } from 'luxon'
import { InputItemData } from '../types/API/InputItemData'
import { UnifiedItem } from '../types/API/UnifiedItem'
import { UnifiedItemData } from '../types/API/UnifiedItemData'
import { Driver } from './Driver'
import { Transaction } from '../types/API/Transaction'

/**
 * A base class for drivers fetching data from the remote.
 */
export class InputDriver extends Driver {

  canHandleInput(): boolean {
    return true
  }

  /**
   * Handler for actual data fetching.
   * @returns New data found.
   */
  async fetchData(flowPlan: FlowPlanModel): Promise<string | Buffer> {
    throw new Error(`Input source ${this.type} does not implement fetchData().`)
  }

  /**
   * Take the input batch fetched and provide a list of processable input items.
   */
  async itemizeInput(batch: BatchModel): Promise<InputItemData[]> {
    throw new Error(`Input source ${this.type} does not implement itemizeInput().`)
  }

  /**
   * Helper to implement rule based handling for unifying input items.
   * @param flow
   * @param input
   * @param rules
   */
  protected async applyUnifyRules(flow: FlowPlanModel, run: RunModel, input: InputItemModel, rules: Record<string, RuleModel[]>, ruleKey: string | null = null): Promise<UnifiedItem> {

    if (RuleModel.count(rules) === 0) {
      throw new Error(`There are no rules available in ${flow} for unifying input.`)
    }

    // Execute rules.
    const variables = {
      text: input.text,
      line: input.line,
      time: input.time,
      total: input.total,
      original: input.original,
      version: (input.data.data as unknown as InputItemData).version,
      ...this.projectSettings,
      ...input.fields
    }

    const data: UnifiedItemData = applyRules(variables, rules, ruleKey)

    // Add common tags from setup.
    if (this.setup.settings?.tags) {
      this.setup.settings.tags.forEach(tag => {
        if (!data.tags) {
          data.tags = []
        }
        if (!data.tags.includes(tag)) {
          data.tags.push(tag)
        }
      })
    }

    const time = isShortDate(input.time)
      ? DateTime.fromISO(`${input.time}T12:00:00Z`).toUTC().toISO()
      : DateTime.fromISO(`${input.time}`).toUTC().toISO()

    return {
      data,
      time: `${time}`,
      processed: false,
      skipped: false,
      flowPlanId: input.data.flowPlanId,
      batchId: input.data.batchId,
      runId: run.id,
      inputId: input.id,
    }
  }

  /**
   * Take an input item and convert it to the unified model.
   */
  async unifyItem(flow: FlowPlanModel, run: RunModel, input: InputItemModel, rules: Record<string, RuleModel[]>): Promise<UnifiedItem> {
    throw new Error(`Input source ${this.type} does not implement unifyItem().`)
  }

  /**
   * Calculate hash for input item.
   * @param input
   * @returns
   */
  inputHash(input: InputItemData): string {
    return hash(input, { algorithm: 'sha1' })
  }

  /**
   * Calculate hash for output item.
   * @param output
   * @returns
   */
  outputHash(tx: Transaction): string {
    return hash(tx, { algorithm: 'sha1' })
  }
}
