import { Currency, Timestring } from '@tasenor/common'

export interface EnableBankingStartAuthorizationResponse {
  url: string
  authorization_id: string
  psu_id_hash: string
}

export interface EnableBankingAccount {
  account_id: {
    iban: string
    other: null
  }
  uid: string
  name: string
  product: string
  currency: Currency
}

export interface EnableBankingAuthorizeSessionResponse {
  session_id: string
  accounts: EnableBankingAccount[]
  aspsp: {
    name: string
    country: string
  }
  access: {
    valid_until: Timestring
  }
}

/**
 * One page of the transactions of an account. More pages follow while there is a continuation key.
 */
export interface EnableBankingTransactionsResponse {
  transactions: unknown[]
  continuation_key?: string | null
}
