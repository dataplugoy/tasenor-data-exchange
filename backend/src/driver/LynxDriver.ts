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
import { isLynx, lynxItems, lynxOpening, lynxPeriod, parseLynxRows } from '../lib/lynx'
import { OpeningState } from '../types/API/OpeningState'
import { RateFunction, addOpeningAsset, addOpeningBalance, cleanOpeningState, emptyOpeningState, stockAccount } from '../lib/opening'
import { AccountCode } from '../types/AccountCode'
import { Language } from '@tasenor/common'
import { dec } from '../lib/utils'
import { t } from '../lib/i18n/t'

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
    const text = this.text(batch)
    this.version = 1
    return lynxItems(parseLynxRows(text), lynxPeriod(text)?.start || null)
  }

  /**
   * Get the statement text of the batch.
   */
  private text(batch: BatchModel): string {
    if (!batch.data.data) {
      throw new Error(`There is no data in ${batch}.`)
    }
    const text = Buffer.from(batch.data.data).toString('utf-8')
    if (!isLynx(text)) {
      throw new Error('The file is not a Lynx Activity Statement.')
    }
    return text
  }

  canProvideOpeningState(): boolean {
    return true
  }

  async openingState(batch: BatchModel, firstDate: string, rate: RateFunction): Promise<OpeningState | null> {
    const opening = lynxOpening(this.text(batch), firstDate)
    if (!opening) {
      return null
    }
    const language = this.projectSettings.language as Language
    const state = emptyOpeningState(opening.date, this.type)

    for (const cash of opening.cash) {
      const value = await this.openingValue(state, cash.amount, cash.currency, rate, cash.currency)
      if (value !== null) {
        addOpeningBalance(state, `CURRENCY_${cash.currency}` as AccountCode, value)
      }
    }
    for (const position of opening.positions) {
      const [account, asset] = stockAccount(this.setup, 'STOCK', position.symbol as string)
      const value = await this.openingValue(state, position.cost || 0, position.currency, rate, asset)
      if (value !== null) {
        addOpeningAsset(state, account, asset, dec(position.amount), value)
        addOpeningBalance(state, account, value)
      }
      if (position.currency !== this.projectSettings.currency) {
        const note = t(language, 'The statement tells the cost of assets in {{currency}} only in {{currency}}. Their value is converted at the rate of {{date}}, not at the rates of the purchases.', { currency: position.currency, date: state.date })
        if (!state.notes.includes(note)) {
          state.notes.push(note)
        }
      }
    }
    if (opening.corporateActions) {
      state.notes.push(t(language, 'The cost of assets is worked back from the trades. Corporate actions of the statement are not taken into account.'))
    }

    cleanOpeningState(state)
    return state
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
