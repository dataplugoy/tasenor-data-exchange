import { BatchModel } from '../models/BatchModel'
import { InputItemData } from '../types/API/InputItem'
import { NordeaTitoDriverSettings } from '../types/DriverSettings'
import { ManualUploadFlowState } from '../types/FlowState'
import { ManualUploadDriver } from './ManualUploadDriver'
import { FlowPlanModel } from '../models/FlowPlanModel'
import { RunModel } from '../models/RunModel'
import { InputItemModel } from '../models/InputItemModel'
import { RuleModel } from '../models/RuleModel'
import { UnifiedItem } from '../types/API/UnifiedItem'
import { ProjectSettings } from '../types/API/Project'
import { Setup } from '../types/API/Setup'
import { isTito, parseTitoRecords, titoItems } from '../lib/tito'

/**
 * A driver to upload Nordea bank statements in TITO format.
 */
export class NordeaTitoDriver extends ManualUploadDriver {

  declare settings: NordeaTitoDriverSettings
  declare state: ManualUploadFlowState

  constructor(settings: NordeaTitoDriverSettings, projectSettings: ProjectSettings, setup: Setup = {}) {
    super(settings, projectSettings, setup, 'NORDEA_TITO')
  }

  async itemizeInput(batch: BatchModel): Promise<InputItemData[]> {
    if (!batch.data.data) {
      throw new Error(`There is no data in ${batch}.`)
    }
    // eslint-disable-next-line
    const text = batch.data.data.toString((batch.data.encoding || 'latin1') as BufferEncoding)
    if (!isTito(text)) {
      throw new Error('The file is not a TITO statement.')
    }
    this.version = 1
    return titoItems(parseTitoRecords(text))
  }

  async unifyItem(flow: FlowPlanModel, run: RunModel, input: InputItemModel, rules: Record<string, RuleModel[]>): Promise<UnifiedItem> {
    return this.applyUnifyRules(flow, run, input, rules, null)
  }
}
