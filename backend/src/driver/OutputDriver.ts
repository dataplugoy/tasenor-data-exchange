import { OutputItemModel } from '../models/OutputItemModel'
import { RemoteAccount } from '../types/API/RemoteAccount'
import { RemoteId } from '../types/API/RemoteId'
import { Driver } from './Driver'

/**
 * A base class for drivers delivering output.
 */
export class OutputDriver extends Driver {
  /**
   * Fetch available accounts from the remote.
   */
  async fetchRemoteAccounts(): Promise<RemoteAccount[]> {
    throw new Error(`Output destination ${this.type} does not implement fetchRemoteAccounts().`)
  }

  /**
   * Check if account configuration should be checked before output.
   * @returns
   */
  needConfiguredAccounts(): boolean {
    return false
  }

  /**
   * Handle transfer of the output item.
   */
  async deliverOutput(output: OutputItemModel): Promise<RemoteId> {
    throw new Error(`Input source ${this.type} does not implement deliverOutput().`)
  }
}
