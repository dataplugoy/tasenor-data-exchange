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

  async fetchData(_lastStamp: Date | null): Promise<string> {
    // TODO: Pass flow-plan and URL could be `GET /api/v1/flow-plans/${flow.id}/continue`.
    throw new Error('Need more info to build proper URL in fetchData().')
  }
}
