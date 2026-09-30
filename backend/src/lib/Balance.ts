import Decimal from 'decimal.js'
import { AccountCode } from '../types/AccountCode'
import { dec, toJSON } from './utils'
import { JsonValue } from '@prisma/client/runtime/client'

export class Balance {
  private balance: Record<AccountCode, Decimal>

  constructor(init: Record<AccountCode, Decimal | string | number>) {
    this.balance = {}
    Object.keys(init).forEach(acc => this.setBalance(acc as AccountCode, init[acc]))
  }

  setBalance(acc: AccountCode, value: number | string | Decimal) {
    this.balance[acc] = dec(value)
  }

  addBalance(acc: AccountCode, value: number | string | Decimal) {
    if (!(acc in this.balance)) {
      this.balance[acc] = dec(value)
    } else {
      this.balance[acc] = this.balance[acc].plus(dec(value))
    }
  }

  getBalance(acc: AccountCode): Decimal {
    if (acc in this.balance) {
      return this.balance[acc]
    } else {
      return dec(0)
    }
  }

  toJSON(decimalsToString = false): JsonValue {
    return toJSON(this.balance, decimalsToString)
  }
}
