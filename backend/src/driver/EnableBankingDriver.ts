import jwa from 'jwa'
import { EnableBankingDriverSettings } from '../types/DriverSettings'
import config from '../config'
import { EnableBankingAuthorizeSessionResponse, EnableBankingStartAuthorizationResponse } from '../types/EnableBanking'
import { EnableBankingFlowState } from '../types/FlowState'
import { DateTime } from 'luxon'
import { FlowPlanModel } from '../models/FlowPlanModel'
import { ProjectSettings } from '../types/API/Project'
import { InternetDriver } from './InternetDriver'

/**
 * Helper to encode JSON as base64.
 */
const jsonBase64 = (data: Record<string, any>) => {
  return Buffer.from(JSON.stringify(data)).toString('base64').replace('=', '')
}

/**
 * A simple file based driver for providing mock data from the development tree.
 */
export class EnableBankingDriver extends InternetDriver {

  declare settings: EnableBankingDriverSettings
  declare state: EnableBankingFlowState

  constructor(settings: EnableBankingDriverSettings, projectSettings: ProjectSettings) {
    super(settings, projectSettings, 'ENABLE_BANKING')
  }

  canHandleInput(): boolean {
    return true
  }

  /**
   * Create a JWT token for this application.
   */
  protected bearerToken() {
    const iat = Math.floor((new Date()).getTime() / 1000)
    const expire = 60 // 1 minute

    const jwtBody = {
      iss: 'enablebanking.com',
      aud: 'api.enablebanking.com',
      iat,
      exp: iat + expire
    }

    const header = jsonBase64({
      typ: 'JWT',
      alg: 'RS256',
      kid: this.systemSettings.apikey
    })

    const body = jsonBase64(jwtBody)

    const signature = jwa('RS256').sign(`${header}.${body}`, this.systemSettings.certificate)

    return `${header}.${body}.${signature}`
  }

  async autheticate(): Promise<EnableBankingFlowState> {
    // Check if old credentials are valid.
    if (this.state.validUntil) {
      const validUntil = DateTime.fromISO(this.state.validUntil)
      if (DateTime.now() < validUntil) {
        return this.state
      }
    }

    // Start new authentication if not continuing.
    if (!this.options.auth) {

      const validUntil = new Date(new Date().getTime() + this.settings.sessionInDays * 24 * 60 * 60 * 1000)
      const startAuthorizationRequest = {
        access: {
          valid_until: validUntil.toISOString()
        },
        aspsp: {
          name: this.settings.bankName,
          country: this.settings.country,
        },
        state: 'NOT-YET-IN-TADEX-USE', // Pass any info here.
        redirect_url: config.SITE_URL, // TODO: Need proper redirect URL.
        psu_type: this.settings.psuType,
      }

      // TODO: Need to handle cleanly when using UI.
      const resp: EnableBankingStartAuthorizationResponse = await this.POST('/auth', startAuthorizationRequest)
      console.log()
      console.log('PLEASE SIGN IN TO THE FOLLOWING URL AND RETRY USING --auth <code>.')
      console.log()
      console.log(resp.url)
      console.log()
      // TODO: Throw instead? Need separate AborError to have special handling for this?
      process.exit()
    }

    // Establish the session.
    const resp: EnableBankingAuthorizeSessionResponse = await this.POST('/sessions', { code: this.options.auth })

    const account = resp.accounts.filter(acc => acc.account_id && acc.account_id.iban === this.settings.iban)
    if (account.length < 1) {
      throw new Error(`Unable to find account ${this.settings.iban}.`)
    }

    this.state = {
      sessionId: resp.session_id,
      accountId: account[0].uid,
      validUntil: resp.access.valid_until
    }

    return this.state
  }

  async fetchData(_flowPlan: FlowPlanModel): Promise<string> {
    const output = await this.GET(`/accounts/${this.state.accountId}/transactions`)
    // TODO: Handle continuation_key.
    // console.dir(out, {depth: null})
    return JSON.stringify(output)
  }
}
