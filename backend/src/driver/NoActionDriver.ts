import { log } from '@tasenor/common'
import { OutputItemModel } from '../models/OutputItemModel'
import { NoActionDriverSettings } from '../types/DriverSettings'
import { NoActionFlowState } from '../types/FlowState'
import { Transaction } from '../types/API/Transaction'
import { ProjectSettings } from '../types/API/Project'
import { Setup } from '../types/API/Setup'
import { RemoteId } from '../types/API/RemoteId'
import { OutputDriver } from './OutputDriver'

export class NoActionDriver extends OutputDriver {

  declare settings: NoActionDriverSettings
  declare state: NoActionFlowState

  constructor(settings: NoActionDriverSettings, projectSettings: ProjectSettings, setup: Setup = {}) {
    super(settings, projectSettings, setup, 'NO_ACTION')
  }

  async autheticate(): Promise<NoActionFlowState> {
    return this.state
  }

  async deliverOutput(output: OutputItemModel): Promise<RemoteId> {
    const data = output.data.data as unknown as Transaction
    log('Output:')
    log(`        Time: ${JSON.stringify(data.time)}`)
    data.lines.forEach((line, idx) => {
      log(`        Line[${idx}]: ${JSON.stringify(line)}`)
    })

    return { type: 'TRIVIAL' }
  }

  needConfiguredAccounts(): boolean {
    return false
  }

  canRollback(): boolean {
    return true
  }

  async rollbackOuput(output: OutputItemModel): Promise<void> {
  }
}
