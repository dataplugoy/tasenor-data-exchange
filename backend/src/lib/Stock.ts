import { Asset } from '@tasenor/common'
import Decimal from 'decimal.js'
import { toJSON } from './utils'
import { JsonValue } from '@prisma/client/runtime/library'

export type AssetRecord = {
  amount: Decimal
  value: Decimal
}

export type StockData = Partial<Record<Asset, AssetRecord>>

export type StockChangeData = Partial<Record<Asset, {
  amount: number | string | Decimal
  value: number | string | Decimal
}>>

export class Stock {

  private stock: StockData

  constructor(stock: StockChangeData) {
    this.stock = {}
    Object.keys(stock).forEach(ticker => {
      this.stock[ticker] = {
        amount: new Decimal(stock[ticker].amount),
        value: new Decimal(stock[ticker].value),
      }
    })
  }

  /**
   * Get the record for an asset. Create if needed.
   * @param asset
   */
  getAsset(asset: Asset): AssetRecord {
    if (!(asset in this.stock)) {
      this.stock[asset] = {
        amount: new Decimal(0),
        value: new Decimal(0),
      }
    }
    return this.stock[asset] as AssetRecord
  }

  /**
   * Update stock.
   * @param asset
   * @param amount
   * @param value
   */
  addAsset(asset: Asset, amount: Decimal, value: Decimal): void {
    const record = this.getAsset(asset)

    record.amount = record.amount.plus(amount)
    record.value = record.value.plus(value)
  }

  /**
   * Get the current value per unit for an asset.
   * @param asset
   */
  getValue(asset: Asset): Decimal {
    const record = this.getAsset(asset)
    return record.value.dividedBy(record.amount)
  }

  toJSON(): JsonValue {
    return toJSON(this.stock)
  }
}
