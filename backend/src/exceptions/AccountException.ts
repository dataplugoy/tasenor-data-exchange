import { HttpMethod } from '@tasenor/common'
import { Account } from '../types/API/Account'

/**
 * Cannot figure out remote account from setup.
 */
export class AccountException extends Error {
  code: Account

  constructor(code: Account) {
    super(`AccountException: unable resolve remote account ${JSON.stringify(code)}.`)
    this.code = code
  }
}
