import { log } from '@tasenor/common'
import { OutputItemModel } from '../models/OutputItemModel'
import { NoActionDriverSettings } from '../types/DriverSettings'
import { NoActionFlowState } from '../types/FlowState'
import { Driver } from './Driver'
import { Transaction } from '../types/API/Transaction'

export class NoActionDriver extends Driver {

  declare settings: NoActionDriverSettings
  declare state: NoActionFlowState

  constructor(settings: NoActionDriverSettings) {
    super(settings, 'NO_ACTION')
  }

  canHandleOutput(): boolean {
    return true
  }

  async deliverOutput(output: OutputItemModel): Promise<void> {
    const data = output.data.data as unknown as Transaction
    log('Output:')
    log(`        Time: ${JSON.stringify(data.time)}`)
    data.lines.forEach((line, idx) => {
      log(`        Line[${idx}]: ${JSON.stringify(line)}`)
    })
  }
}
