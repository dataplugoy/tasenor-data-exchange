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

export class ProcountorDriver extends OutputDriver {

  declare settings: ProcountorDriverSettings
  declare state: ProcountorFlowState

  vat: ProcountorVAT | null

  constructor(settings: ProcountorDriverSettings, projectSettings: ProjectSettings, setup: Setup = {}) {
    super(settings, projectSettings, setup, 'PROCOUNTOR')
    this.vat = null
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

  async deliverOutput(output: OutputItemModel, unified: UnifiedItemModel): Promise<RemoteId> {
    const tx = output.data.data as unknown as Transaction
    this.state = await this.autheticate()

    // TODO: In future when we have VAT entries, need to reconstruct entries here accordingly.
    const vat = unified.isSales() ? await this.getVAT('0% VAT turnover') : await this.getVAT('No VAT reg.')

    // TODO: Handle dimensions.
    const receipt = {
      type: 'JOURNAL',
      name: this.name(tx),
      receiptDate: tx.time.substring(0, 10),
      vatType: unified.isSales() ? 'SALES' : 'PURCHASE',
      vatStatus: vat.vatStatus,
      transactions: tx.lines.map(line => ({
        transactionType: 'ENTRY',
        account: this.getAccount(line),
        accountingValue: line.amount,
        description: line.text,
        vatPercent: 0,
      }))
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
