import qs from 'qs'
import { AccountNumber, Timestring } from '@tasenor/common'
import { ProjectSettings } from '../types/API/Project'
import { ProcountorDriverSettings } from '../types/DriverSettings'
import { Setup } from '../types/API/Setup'
import { OutputDriver } from './OutputDriver'
import { ProcountorFlowState } from '../types/FlowState'
import { RemoteAccount } from '../types/API/RemoteAccount'
import { DateTime } from 'luxon'
import { Account, Transaction } from '../types/API/Transaction'
import { OutputItemModel } from '../models/OutputItemModel'
import { RemoteId } from '../types/API/RemoteId'
import { UnifiedItemModel } from '../models/UnifiedItemModel'
import { TransactionLine } from '../types/API/TransactionLine'
import { AccountException } from '../exceptions/AccountException'
import { isAccountNumber } from '../types/AccountCode'

const HINTS = {
  'Muu vaihto-omaisuus': ['CRYPTO', 'STOCK'],
  'Myynti, arvopaperit ja kiinteistöt': ['PROFIT'],
  'Rahoituskulut, muut': ['FEE'],
  'Myynnin luottotappiot': ['LOSS'],
  'Muut liikekulut': ['EXPENSE'],
  'Muut tuotot': ['INCOME'],
  'Pankkisaamiset, pankki2': ['CURRENCY'],
  'Pankkisaamiset, pankki3': ['CURRENCY'],
  'Pankkisaamiset, pankki4': ['CURRENCY'],
  'Pankkisaamiset, pankki5': ['CURRENCY'],
  'Pankkisaamiset, pankki6': ['CURRENCY'],
  'Pankkisaamiset, pankki7': ['CURRENCY'],
  'Pankkisaamiset, pankki8': ['CURRENCY'],
}

export type ProcountorAccount = {
  ledgerAccountCode: AccountNumber
  name: string
  active: boolean
  translations: Record<string, string>
}

export type ProcountorVATStatus = {
  vatStatus: number
  description: string
  sales: boolean
  purchase: boolean
}

export type ProcountorVATInformation = {
  country: string
  percentages: { vatPercent: number, sales: boolean, purchase: boolean }[]
}

export type ProcountorVAT = {
  vatInformation: ProcountorVATInformation[]
  vatStatuses: ProcountorVATStatus[]
}

export type ProcountorDimensionItem = {
  id: number
  codeName: string
}

export type ProcountorDimension = {
  id: number
  name: string
  items?: ProcountorDimensionItem[]
}

export type ProcountorDimensionValue = {
  dimensionId: number
  itemId: number
  value: number
}

export type ProcountorTransaction = {
  transactionType: string
  account: string
  accountingValue: number
  description: string
  vatPercent: number
  dimensionItemValues: ProcountorDimensionValue[]
}

export class ProcountorDriver extends OutputDriver {

  declare settings: ProcountorDriverSettings
  declare state: ProcountorFlowState

  vat: ProcountorVAT | null
  dimensions: ProcountorDimension[] | null

  constructor(settings: ProcountorDriverSettings, projectSettings: ProjectSettings, setup: Setup = {}) {
    super(settings, projectSettings, setup, 'PROCOUNTOR')
    this.vat = null
    this.dimensions = null
    this.rateLimit = 60
  }

  needConfiguredAccounts(): boolean {
    return true
  }

  protected get baseUrl(): string {
    return this.systemSettings.url
  }

  protected bearerToken(): string | null {
    return this.state && this.state.token ? this.state.token : null
  }

  async autheticate(): Promise<ProcountorFlowState> {

    // Check old and leave 5 second margin.
    if (this.state.token) {
      if (DateTime.now().minus({ seconds: 5 }) < DateTime.fromISO(this.state.expires)) {
        return this.state
      }
    }

    const { clientId, clientSecret, redirectUrl } = this.systemSettings.data.options as { clientId: string, clientSecret: string, redirectUrl: string }

    const data = qs.stringify({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUrl,
      api_key: this.settings.apiKey
    })
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded'
    }

    const res = await this.request<any>('POST', this.makeUrl('/api/oauth/token'), data, headers)

    if (res && res.access_token && res.expires_in) {
      const expires = DateTime.now().plus({ seconds: res.expires_in }).toUTC().toISO() as Timestring
      return { token: res.access_token, expires }
    }

    throw new Error(`Authentication to ${this.makeUrl('/api/oauth/token')} as ${clientId} failed.`)
  }

  async fetchRemoteAccounts(): Promise<RemoteAccount[]> {
    this.state = await this.autheticate()

    const res = await this.GET<{
      ledgerAccounts: {
        ledgerAccountCode: AccountNumber
        name: string
        active: boolean
        translations: Record<string, string>
      }[]
    }>('/api/coa')

    const hints = (acc: ProcountorAccount): Account[] => {
      return HINTS[acc.name] || []
    }

    return res.ledgerAccounts.filter(acc => acc.active).map(acc => ({
      name: acc.name,
      number: acc.ledgerAccountCode,
      hints: hints(acc)
    }))
  }

  getAccount(line: TransactionLine): Account {
    const accounts: Record<string, string> = this.setup.accounts as Record<string, string> || {}
    if (line.account in accounts) {
      return accounts[line.account]
    }
    if (isAccountNumber(line.account)) {
      return line.account
    }
    throw new AccountException(line.account)
  }

  name(tx: Transaction) {
    const names = new Set(tx.lines.filter(line => !!line.text).map(line => line.text))
    return [...names].join(' ')
  }

  /**
   * Collect VAT items and find the id of the one with the mathching name.
   */
  async getVAT(description: string): Promise<ProcountorVATStatus> {
    if (!this.vat) {
      this.state = await this.autheticate()
      this.vat = await this.GET<ProcountorVAT>('/api/vats/default')
    }

    const vat = this.vat.vatStatuses.find(vat => vat.description === description)
    if (!vat) {
      throw new Error(`Cannot find VAT entry named '${description}' for Procountor.`)
    }
    return vat
  }

  async getDimension(tag: string): Promise<[ProcountorDimension, ProcountorDimensionItem] | null> {
    if (!this.dimensions) {
      this.dimensions = await this.GET<ProcountorDimension[]>('/api/dimensions')
    }

    for (const dimension of this.dimensions) {
      if (!dimension.items) {
        continue
      }
      for (const item of dimension.items) {
        if (item.codeName === tag) {
          return [dimension, item]
        }
      }
    }

    return null
  }

  accountingValue(amount: string | number): number {
    return Math.round(parseFloat(`${amount}`) * 100) / 100
  }

  async resolveDimensions(line: TransactionLine) {
    if (!line.extras.tags) {
      return []
    }

    // Collect and order them first.
    const result: Record<number, number[]> = {}
    for (const tag of line.extras.tags) {
      const res = await this.getDimension(tag)
      if (!res) {
        throw new Error(`Unable to find dimension called '${tag}' from the Procountor.`)
      }
      const [dim, item] = res
      if (!result[dim.id]) {
        result[dim.id] = []
      }
      result[dim.id].push(item.id)
      if (result[dim.id].length > 1) {
        throw new Error(`Splitting an accounting value between more than two dimensions ${line.extras.tags.join(', ')} is not implemented.`)
      }
    }

    // Construct the result.
    const dims: ProcountorDimensionValue[] = []
    Object.keys(result).forEach(dimensionId => {
      result[dimensionId].forEach(itemId => {
        dims.push({
          dimensionId: parseInt(dimensionId),
          itemId,
          value: this.accountingValue(line.amount)
        })
      })
    })
    return dims
  }

  async deliverOutput(output: OutputItemModel, unified: UnifiedItemModel): Promise<RemoteId> {
    const tx = output.data.data as unknown as Transaction
    this.state = await this.autheticate()

    // TODO: In future when we have VAT entries, need to reconstruct entries here accordingly.
    const vat = unified.isSales() ? await this.getVAT('0% VAT turnover') : await this.getVAT('No VAT reg.')

    const receipt = {
      type: 'JOURNAL',
      name: this.name(tx),
      receiptDate: tx.time.substring(0, 10),
      vatType: unified.isSales() ? 'SALES' : 'PURCHASE',
      vatStatus: vat.vatStatus,
      transactions: [] as ProcountorTransaction[]
    }

    for (const line of tx.lines) {
      receipt.transactions.push({
        transactionType: 'ENTRY',
        account: this.getAccount(line),
        accountingValue: this.accountingValue(line.amount),
        description: line.text,
        vatPercent: 0,
        dimensionItemValues: await this.resolveDimensions(line),
      })
    }

    const res = await this.POST('/api/ledgerreceipts', receipt) as { id: number }

    if (this.settings.autoApprove) {
      await this.PUT(`/api/ledgerreceipts/${res.id}/approve`, undefined)
    }

    return {
      type: 'ID',
      id: res.id
    }
  }
}
