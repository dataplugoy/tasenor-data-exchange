import { UploadRequired } from '../exceptions/AlertException'
import { _ } from '../lib/i18n/t'
import { FlowPlanModel } from '../models/FlowPlanModel'
import { ManualUploadDriverSettings } from '../types/DriverSettings'
import { ManualUploadFlowState } from '../types/FlowState'
import { Driver } from './Driver'

export class ManualUploadDriver extends Driver {

  declare settings: ManualUploadDriverSettings
  declare state: ManualUploadFlowState

  constructor(settings: ManualUploadDriverSettings) {
    super('MANUAL_UPLOAD', settings)
  }

  canHandleInput(): boolean {
    return true
  }

  async autheticate(): Promise<ManualUploadFlowState> {
    return {}
  }

  async fetchData(flowPlan: FlowPlanModel): Promise<string> {
    throw new UploadRequired(`/flow-plans/${flowPlan.id}/continue`, _('Please select a statement to upload.'), this.options.userId)
  }
}
