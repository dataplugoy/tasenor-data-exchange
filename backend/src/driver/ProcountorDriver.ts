import qs from 'qs'
import { AccountModelData, AccountNumber, PeriodModelData, Timestring } from '@tasenor/common'
import { ProjectSettings } from '../types/API/Project'
import { ProcountorDriverSettings } from '../types/DriverSettings'
import { Setup } from '../types/API/Setup'
import { OutputDriver } from './OutputDriver'
import { ProcountorFlowState } from '../types/FlowState'
import { RemoteAccount } from '../types/API/RemoteAccount'
import { DateTime } from 'luxon'

export class ProcountorDriver extends OutputDriver {

  declare settings: ProcountorDriverSettings
  declare state: ProcountorFlowState

  private periods: PeriodModelData[]
  private accounts: Record<AccountNumber, AccountModelData>

  constructor(settings: ProcountorDriverSettings, projectSettings: ProjectSettings, setup: Setup = {}) {
    super(settings, projectSettings, setup, 'PROCOUNTOR')
    this.periods = []
    this.accounts = {}
  }

  needConfiguredAccounts(): boolean {
    return true
  }

  protected get baseUrl(): string {
    return this.systemSettings.url
  }

  async autheticate(): Promise<ProcountorFlowState> {
    // TODO: Check old token and expiry.

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
console.log(this.state)
    return []
  }
}
