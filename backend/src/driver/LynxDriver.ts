import { BatchModel } from '../models/BatchModel'
import { InputItemData } from '../types/API/InputItem'
import { LynxDriverSettings } from '../types/DriverSettings'
import { ManualUploadFlowState } from '../types/FlowState'
import { ManualUploadDriver } from './ManualUploadDriver'
import { FlowPlanModel } from '../models/FlowPlanModel'
import { RunModel } from '../models/RunModel'
import { InputItemModel } from '../models/InputItemModel'
import { RuleModel } from '../models/RuleModel'
import { UnifiedItem } from '../types/API/UnifiedItem'
import { ProjectSettings } from '../types/API/Project'
import { Setup } from '../types/API/Setup'
import { isLynx, lynxItems, parseLynxRows } from '../lib/lynx'

/**
 * A driver to upload Lynx (Interactive Brokers) Activity Statements.
 */
export class LynxDriver extends ManualUploadDriver {

  declare settings: LynxDriverSettings
  declare state: ManualUploadFlowState

  constructor(settings: LynxDriverSettings, projectSettings: ProjectSettings, setup: Setup = {}) {
    super(settings, projectSettings, setup, 'LYNX')
  }

  async itemizeInput(batch: BatchModel): Promise<InputItemData[]> {
    if (!batch.data.data) {
      throw new Error(`There is no data in ${batch}.`)
    }
    const text = batch.data.data.toString('utf-8')
    if (!isLynx(text)) {
      throw new Error('The file is not a Lynx Activity Statement.')
    }
    this.version = 1
    return lynxItems(parseLynxRows(text))
  }

  answerKey(input: InputItemModel): string {
    return input.fields.Key as string
  }

  async unifyItem(flow: FlowPlanModel, run: RunModel, input: InputItemModel, rules: Record<string, RuleModel[]>): Promise<UnifiedItem> {
    return this.applyUnifyRules(flow, run, input, rules, input.fields.Kind as string)
  }
}
