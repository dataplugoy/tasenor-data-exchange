import { Asset } from '@tasenor/common'
import Decimal from 'decimal.js'
import { toJSON } from './utils'
import { JsonValue } from '@prisma/client/runtime/library'
import { AccountCode } from '../types/AccountCode'

export type AssetRecord = {
  amount: Decimal
  value: Decimal
}

export type StockData = Partial<Record<Asset, AssetRecord>>

export type InitialStockData = Record<AccountCode, Record<Asset, {
  amount: number | string | Decimal
  value: number | string | Decimal
}>>

export class Stock {

  private stock: Record<AccountCode, StockData>

  constructor(init: InitialStockData) {
    this.stock = {}
    Object.keys(init).forEach(account => {
      this.stock[account] = {}
      Object.keys(init[account]).forEach(ticker => {
        this.stock[account][ticker] = {
          amount: new Decimal(init[account][ticker].amount),
          value: new Decimal(init[account][ticker].value),
        }
      })
    })
  }

  /**
   * Get the record for an asset. Create if needed.
   * @param asset
   */
  getAsset(account: AccountCode, asset: Asset): AssetRecord {
    if (!(account in this.stock)) {
      this.stock[account] = {}
    }
    if (!(asset in this.stock[account])) {
      this.stock[account][asset] = {
        amount: new Decimal(0),
        value: new Decimal(0),
      }
    }
    return this.stock[account][asset] as AssetRecord
  }

  /**
   * Update stock.
   * @param asset
   * @param amount
   * @param value
   */
  addAsset(account: AccountCode, asset: Asset, amount: Decimal, value: Decimal): void {
    const record = this.getAsset(account, asset)

    record.amount = record.amount.plus(amount)
    record.value = record.value.plus(value)
  }

  /**
   * Get the current value per unit for an asset.
   * @param asset
   */
  getValue(account: AccountCode, asset: Asset): Decimal {
    const record = this.getAsset(account, asset)
    return record.value.dividedBy(record.amount)
  }

  toJSON(): JsonValue {
    return toJSON(this.stock)
  }
}
