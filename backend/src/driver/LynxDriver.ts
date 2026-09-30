import hash from 'object-hash'
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
import { isLynx, lynxItems, lynxPeriod, parseLynxRows } from '../lib/lynx'

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
    const text = Buffer.from(batch.data.data).toString('utf-8')
    if (!isLynx(text)) {
      throw new Error('The file is not a Lynx Activity Statement.')
    }
    this.version = 1
    return lynxItems(parseLynxRows(text), lynxPeriod(text)?.start || null)
  }

  /**
   * Statements are cumulative: the same event appears in all later statements of the year. Its key identifies it,
   * so that also statements read with a newer version of the parser (having more fields) are recognized.
   */
  inputHash(input: InputItemData): string {
    return hash({ Key: input.fields.Key }, { algorithm: 'sha1' })
  }

  answerKey(input: InputItemModel): string {
    return input.fields.Key as string
  }

  async unifyItem(flow: FlowPlanModel, run: RunModel, input: InputItemModel, rules: Record<string, RuleModel[]>): Promise<UnifiedItem> {
    return this.applyUnifyRules(flow, run, input, rules, input.fields.Kind as string)
  }
}
