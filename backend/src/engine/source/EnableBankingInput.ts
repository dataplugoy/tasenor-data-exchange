import jwa from 'jwa'
import { InputSource } from './InputSource'

/**
 * Helper to encode JSON as base64.
 */
const jsonBase64 = (data) => {
  return Buffer.from(JSON.stringify(data)).toString("base64").replace("=", "")
}

/**
 * A simple file based driver for providing mock data from the development tree.
 */
export class EnableBankingInput extends InputSource {

  constructor(settings: Record<string, unknown>) {
    super('ENABLE_BANKING', settings)
  }

  /**
   * Create a JWT token for this application.
   */
  protected bearerToken() {
    const iat = Math.floor((new Date()).getTime() / 1000)
    const expire = 60 * 60 // 1 hour

    const jwtBody = {
      iss: 'enablebanking.com',
      aud: 'api.enablebanking.com',
      iat: iat,
      exp: iat + expire
    }

    const header = jsonBase64({
      typ: "JWT",
      alg: "RS256",
      kid: this.systemSettings.apikey
    })

    const body = jsonBase64(jwtBody)

    const signature = jwa("RS256").sign(`${header}.${body}`, this.systemSettings.certificate)

    return `${header}.${body}.${signature}`
  }

  async autheticate(): Promise<void> {
    await this.GET('/application')
  }

  async fetchData(lastStamp: Date | null): Promise<string> {

    throw new Error('TODO: FETCH')
  }
}
