import { NoActionDriverSettings } from "../types/DriverSettings"
import { NoActionFlowState } from "../types/FlowState"
import { Driver } from "./Driver"

export class NoActionDriver extends Driver {

  declare settings: NoActionDriverSettings
  declare state: NoActionFlowState

  constructor(settings: NoActionDriverSettings) {
    super('NO_ACTION', settings)
  }

  canHandleOutput(): boolean {
    return true
  }
}
