import prisma from '@prisma/client'
import { UploadRequired } from '../exceptions/AlertException'
import { _ } from '../lib/i18n/t'
import { BatchModel } from '../models/BatchModel'
import { FlowPlanModel } from '../models/FlowPlanModel'
import { ManualUploadDriverSettings } from '../types/DriverSettings'
import { ManualUploadFlowState } from '../types/FlowState'
import { Driver } from './Driver'

/**
 * A base class for drivers that use manual upload.
 */
export class ManualUploadDriver extends Driver {

  declare settings: ManualUploadDriverSettings
  declare state: ManualUploadFlowState

  constructor(settings: ManualUploadDriverSettings, type: prisma.DriverType = 'MANUAL_UPLOAD') {
    super(settings, type)
  }

  canHandleInput(): boolean {
    return true
  }

  async autheticate(): Promise<ManualUploadFlowState> {
    return {}
  }

  async fetchData(flowPlan: FlowPlanModel): Promise<Buffer> {
    console.log('here')
    const batch = await BatchModel.getLatest(flowPlan)
    if (batch && batch.data.data !== null) {
      return batch.data.data
    }
    throw new UploadRequired(`/api/v1/flow-plans/${flowPlan.id}/continue`, _('Please select a statement to upload.'), this.options.userId)
  }
}
