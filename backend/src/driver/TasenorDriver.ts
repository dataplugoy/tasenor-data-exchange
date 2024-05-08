import { ProjectSettings } from '../types/API/Project'
import { TasenorDriverSettings } from '../types/DriverSettings'
import { TasenorFlowState } from '../types/FlowState'
import { InternetDriver } from './InternetDriver'

export class TasenorDriver extends InternetDriver {

  declare settings: TasenorDriverSettings
  declare state: TasenorFlowState

  constructor(settings: TasenorDriverSettings, projectSettings: ProjectSettings) {
    super(settings, projectSettings, 'TASENOR')
  }

}
