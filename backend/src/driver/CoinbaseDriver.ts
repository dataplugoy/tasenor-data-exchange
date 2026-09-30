import hash from 'object-hash'
import { BatchModel } from '../models/BatchModel'
import { InputItemData } from '../types/API/InputItem'
import { CoinbaseDriverSettings } from '../types/DriverSettings'
import { ManualUploadFlowState } from '../types/FlowState'
import { ManualUploadDriver } from './ManualUploadDriver'
import { FlowPlanModel } from '../models/FlowPlanModel'
import { RunModel } from '../models/RunModel'
import { InputItemModel } from '../models/InputItemModel'
import { RuleModel } from '../models/RuleModel'
import { UnifiedItem } from '../types/API/UnifiedItem'
import { ProjectSettings } from '../types/API/Project'
import { Setup } from '../types/API/Setup'
import { coinbaseItems, coinbaseVersion } from '../lib/coinbase'

/**
 * A driver to upload Coinbase transaction exports.
 */
export class CoinbaseDriver extends ManualUploadDriver {

  declare settings: CoinbaseDriverSettings
  declare state: ManualUploadFlowState

  constructor(settings: CoinbaseDriverSettings, projectSettings: ProjectSettings, setup: Setup = {}) {
    super(settings, projectSettings, setup, 'COINBASE')
  }

  async itemizeInput(batch: BatchModel): Promise<InputItemData[]> {
    if (!batch.data.data) {
      throw new Error(`There is no data in ${batch}.`)
    }
    const text = batch.data.data.toString('utf-8')
    const found = coinbaseVersion(text)
    if (!found) {
      throw new Error('The file is not a Coinbase transaction export.')
    }
    this.version = found.version
    return coinbaseItems(text)
  }

  /**
   * Exports may overlap. The event ID identifies the event, so that also exports read with a newer version of the
   * parser (having more fields) are recognized.
   */
  inputHash(input: InputItemData): string {
    return hash({ Id: input.fields.Id }, { algorithm: 'sha1' })
  }

  answerKey(input: InputItemModel): string {
    return input.fields.Id as string
  }

  async unifyItem(flow: FlowPlanModel, run: RunModel, input: InputItemModel, rules: Record<string, RuleModel[]>): Promise<UnifiedItem> {
    return this.applyUnifyRules(flow, run, input, rules, input.fields.Kind as string)
  }
}
