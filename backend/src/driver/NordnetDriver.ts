import { NordnetDriverSettings } from '../types/DriverSettings'
import { NordnetFlowState } from '../types/FlowState'
import { ManualUploadDriver } from './ManualUploadDriver'

/**
 * A base class for drivers that use manual upload.
 */
export class NordnetDriver extends ManualUploadDriver {

  declare settings: NordnetDriverSettings
  declare state: NordnetFlowState

  constructor(settings: NordnetDriverSettings) {
    super(settings, 'NORDNET')
  }
}
