import { AccountException } from '../exceptions/AccountException'
import { OutputItemModel } from '../models/OutputItemModel'
import { UnifiedItemModel } from '../models/UnifiedItemModel'
import { RemoteAccount } from '../types/API/RemoteAccount'
import { RemoteId } from '../types/API/RemoteId'
import { Settings } from '../types/API/Settings'
import { AccountCode } from '../types/AccountCode'
import { Driver } from './Driver'

/**
 * A base class for drivers delivering output.
 */
export class OutputDriver extends Driver {

  canHandleOutput(): boolean {
    return true
  }

  /**
   * Find the number of configured account.
   */
  configuredAccount<T = string>(code: AccountCode): T {
    const map: Record<AccountCode, T> = this.setup.accounts as Record<AccountCode, T> || {}
    if (!map[code]) {
      if (code.startsWith('DEBT_CURRENCY_')) {
        const currency = code.substring(14)
        const settings: Settings = this.setup.settings || {}
        const debtAccounts = settings.debtAccounts || {}
        if (currency in debtAccounts) {
          return debtAccounts[currency] as T
        }
      }
      throw new AccountException(code)
    }
    return map[code]
  }

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
  async deliverOutput(output: OutputItemModel, unified: UnifiedItemModel): Promise<RemoteId> {
    throw new Error(`Output destination ${this.type} does not implement deliverOutput().`)
  }

  /**
   * Remove delivered transaction from the remote.
   * @param output
   */
  async rollbackOuput(output: OutputItemModel): Promise<void> {
    throw new Error(`Output destination ${this.type} does not implement rollbackOuput().`)
  }
}
