import { log } from '@tasenor/common'
import { OutputItemModel } from '../models/OutputItemModel'
import { NoActionDriverSettings } from '../types/DriverSettings'
import { NoActionFlowState } from '../types/FlowState'
import { Driver } from './Driver'
import { Transaction } from '../types/API/Transaction'
import { ProjectSettings } from '../types/API/Project'
import { RemoteId } from '../types/RemoteId'
import { Setup } from '../types/API/Setup'

export class NoActionDriver extends Driver {

  declare settings: NoActionDriverSettings
  declare state: NoActionFlowState

  constructor(settings: NoActionDriverSettings, projectSettings: ProjectSettings, setup: Setup = {}) {
    super(settings, projectSettings, setup, 'NO_ACTION')
  }

  async autheticate(): Promise<NoActionFlowState> {
    return this.state
  }

  canHandleOutput(): boolean {
    return true
  }

  async deliverOutput(output: OutputItemModel): Promise<RemoteId> {
    const data = output.data.data as unknown as Transaction
    log('Output:')
    log(`        Time: ${JSON.stringify(data.time)}`)
    data.lines.forEach((line, idx) => {
      log(`        Line[${idx}]: ${JSON.stringify(line)}`)
    })

    return 0 as RemoteId
  }

  needConfiguredAccounts(): boolean {
    // TODO: Just test.
    return true
  }
}
