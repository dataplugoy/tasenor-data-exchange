import { Email, Token } from '@tasenor/common'

export interface LoginData {
  token: Token
  id: number
  email: Email
  name: string
  address: string
  zip: string
  city: string
  country: string
  settings: Record<string, unknown> // TODO: User settings?
}