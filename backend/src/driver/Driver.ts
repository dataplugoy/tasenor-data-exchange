import path from 'path'
import prisma from '@prisma/client'
import { SettingsModel } from '../models/SettingsModel'
import { isShortDate, log } from '@tasenor/common'
import { DriverSettings } from '../types/DriverSettings'
import { RuntimeOptions } from '../types/RuntimeOptions'
import { FlowState } from '../types/FlowState'
import { BatchModel } from '../models/BatchModel'
import { InputItemModel } from '../models/InputItemModel'
import { FlowPlanModel } from '../models/FlowPlanModel'
import { RuleModel } from '../models/RuleModel'
import { applyRules } from '../lib/rules'
import { RunModel } from '../models/RunModel'
import { DateTime } from 'luxon'
import { OutputItemModel } from '../models/OutputItemModel'
import { InputItemData } from '../types/API/InputItemData'
import { UnifiedItem } from '../types/API/UnifiedItem'
import { UnifiedItemData } from '../types/API/UnifiedItemData'
import { ProjectSettings } from '../types/API/Project'
import { RemoteId } from '../types/RemoteId'
import { Setup } from '../types/API/Setup'
import { RemoteAccount } from '../types/API/RemoteAccount'

/**
 * Base class for different input sources and output destinations supported.
 */
export class Driver {

  type: prisma.DriverType
  settings: DriverSettings
  systemSettings: SettingsModel
  projectSettings: ProjectSettings
  options: RuntimeOptions
  setup: Setup
  state: FlowState

  constructor(settings: DriverSettings, projectSettings: ProjectSettings, setup: Setup, type: prisma.DriverType) {
    this.type = type
    this.setup = setup
    this.settings = settings
    this.projectSettings = projectSettings
  }

  /**
   * Root path of the repository.
   */
  get root(): string {
    return path.join(path.dirname(path.dirname(__dirname)), 'samples')
  }

  /**
   * If true, driver is able to handle input.
   * @returns
   */
  canHandleInput(): boolean {
    return false
  }

  /**
   * If true, driver is able to handle output.
   * @returns
   */
  canHandleOutput(): boolean {
    return false
  }

  /**
   * Ensure that `url` is defined in settings and return it.
   * @returns URL object.
   */
  getURL(): URL {
    if (!('url' in this.settings)) {
      throw new Error(`Cannot find URL from settings ${JSON.stringify(Object.keys(this.settings))}.`)
    }
    return new URL(`${this.settings.url}`)
  }

  /**
   * A hook to perform initialization before use.
   */
  async initialize(state: FlowState, options: RuntimeOptions): Promise<FlowState> {
    this.options = options
    this.state = state
    this.systemSettings = await SettingsModel.get(this.type)

    return this.state
  }

  /**
   * Handle authentication to the remote.
   */
  async autheticate(): Promise<FlowState> {
    throw new Error(`Input source ${this.type} does not implement autheticate().`)
  }

  /**
   * Handler for actual data fetching.
   * @returns New data found.
   */
  async fetchData(flowPlan: FlowPlanModel): Promise<string | Buffer> {
    throw new Error(`Input source ${this.type} does not implement fetchData().`)
  }

  /**
   * Fetch available accounts from the remote.
   */
  async fetchRemoteAccounts(): Promise<RemoteAccount[]> {
    throw new Error(`Output destination ${this.type} does not implement fetchRemoteAccounts().`)
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

    const variables = {
      text: input.text,
      line: input.line,
      time: input.time,
      total: input.total,
      original: input.original,
      ...this.projectSettings,
      ...input.fields
    }

    const data: UnifiedItemData = applyRules(variables, rules, ruleKey)

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
   * Handle transfer of the output item.
   */
  async deliverOutput(output: OutputItemModel): Promise<RemoteId> {
    throw new Error(`Input source ${this.type} does not implement deliverOutput().`)
  }
}
