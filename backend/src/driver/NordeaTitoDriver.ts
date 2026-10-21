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
import { UnifiedItemData } from '../types/API/UnifiedItemData'
import { ProjectSettings } from '../types/API/Project'
import { Setup } from '../types/API/Setup'
import { isTito, parseTitoRecords, titoItems, titoOpening } from '../lib/tito'
import { OpeningState } from '../types/API/OpeningState'
import { RateFunction, addOpeningBalance, cleanOpeningState, emptyOpeningState } from '../lib/opening'
import { AccountCode } from '../types/AccountCode'

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
    this.version = 1
    return titoItems(parseTitoRecords(this.text(batch)))
  }

  /**
   * Get the statement text of the batch.
   */
  private text(batch: BatchModel): string {
    if (!batch.data.data) {
      throw new Error(`There is no data in ${batch}.`)
    }
    const text = Buffer.from(batch.data.data).toString((batch.data.encoding || 'latin1') as BufferEncoding)
    if (!isTito(text)) {
      throw new Error('The file is not a TITO statement.')
    }
    return text
  }

  canProvideOpeningState(): boolean {
    return true
  }

  async openingState(batch: BatchModel, firstDate: string, rate: RateFunction): Promise<OpeningState | null> {
    const opening = titoOpening(parseTitoRecords(this.text(batch)), firstDate)
    if (!opening) {
      return null
    }
    const state = emptyOpeningState(opening.date, this.type)
    for (const account of opening.accounts) {
      const value = await this.openingValue(state, account.balance, account.Valuutta, rate, account.Tilinumero)
      if (value !== null) {
        // Same as the analyzer makes of the default `bankAccount` set in completeUnified().
        addOpeningBalance(state, `BANK_${account.Tilinumero.toUpperCase().replace(/[^A-Z0-9]/g, '')}` as AccountCode, value)
      }
    }
    cleanOpeningState(state)
    return state
  }

  answerKey(input: InputItemModel): string {
    return input.fields.Arkistointitunnus as string
  }

  completeUnified(input: InputItemModel, data: UnifiedItemData): void {
    if (!data.bankAccount && data.type !== 'skip') {
      data.bankAccount = input.fields.Tilinumero as string
    }
  }

  async unifyItem(flow: FlowPlanModel, run: RunModel, input: InputItemModel, rules: Record<string, RuleModel[]>): Promise<UnifiedItem> {
    return this.applyUnifyRules(flow, run, input, rules, null)
  }
}
