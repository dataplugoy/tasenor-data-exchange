import qs from 'qs'
import { AccountNumber, Timestring } from '@tasenor/common'
import { ProjectSettings } from '../types/API/Project'
import { ProcountorDriverSettings } from '../types/DriverSettings'
import { Setup } from '../types/API/Setup'
import { OutputDriver } from './OutputDriver'
import { ProcountorFlowState } from '../types/FlowState'
import { RemoteAccount } from '../types/API/RemoteAccount'
import { DateTime } from 'luxon'
import { Account } from '../types/API/Transaction'

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

export class ProcountorDriver extends OutputDriver {

  declare settings: ProcountorDriverSettings
  declare state: ProcountorFlowState

  constructor(settings: ProcountorDriverSettings, projectSettings: ProjectSettings, setup: Setup = {}) {
    super(settings, projectSettings, setup, 'PROCOUNTOR')
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
}
