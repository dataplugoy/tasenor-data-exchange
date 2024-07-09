import { Asset, debug } from '@tasenor/common'
import Decimal from 'decimal.js'
import { toJSON } from './utils'
import { JsonValue } from '@prisma/client/runtime/library'
import { AccountCode } from '../types/AccountCode'
import { Transaction } from '../types/API/Transaction'

export type AssetRecord = {
  amount: Decimal
  value: Decimal
}

export type StockDataRecord = Partial<Record<Asset, AssetRecord>>

export type InitialStockData = Record<AccountCode, Record<Asset, {
  amount: number | string | Decimal
  value: number | string | Decimal
}>>

export class Stock {

  private stock: Record<AccountCode, StockDataRecord>

  constructor(init: InitialStockData) {
    debug('STOCK', 'Initial stock')
    debug('STOCK', init)
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
   * Get complete collection of data.
   * @returns
   */
  getAll(): Record<AccountCode, StockDataRecord> {
    return this.stock
  }

  /**
   * Get the record for an asset. Create if needed.
   * @param asset
   */
  getAsset(account: AccountCode, asset: Asset, createMissing: boolean = false): AssetRecord {
    if (!(account in this.stock)) {
      this.stock[account] = {}
    }
    if (!(asset in this.stock[account])) {
      if (!createMissing) {
        return {
          amount: new Decimal(0),
          value: new Decimal(0),
        }
      }
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
    const record = this.getAsset(account, asset, true)

    record.amount = record.amount.plus(amount)
    record.value = record.value.plus(value)
    debug('STOCK', `${asset}: Adding ${amount} of value ${value} to ${account}.`)
    debug('STOCK', `${asset}: Now totalling ${record.amount} of value ${record.value}.`)
  }

  /**
   * Get the current value per unit for an asset or null if none available.
   * @param asset
   */
  getValue(account: AccountCode, asset: Asset): Decimal | null {
    const record = this.getAsset(account, asset)
    return record.amount.eq(0) ? null : record.value.dividedBy(record.amount)
  }

  /**
   * Calculate stock change information for a transaction.
   * @param tx
   */
  getStockChange(tx: Transaction): Record<AccountCode, StockDataRecord> {
    const out: Record<AccountCode, StockDataRecord> = {}
    tx.lines.forEach(line => {
      if (line.extras.assetChange && line.extras.asset) {
        if (!(line.account in out)) {
          out[line.account] = {}
        }
        if (!(line.extras.asset in out[line.account])) {
          out[line.account][line.extras.asset] = {
            amount: new Decimal(0),
            value: new Decimal(0),
          }
        }
        const record: AssetRecord = out[line.account][line.extras.asset] as AssetRecord
        record.amount = record.amount.plus(line.extras.assetChange)
        record.value = record.value.plus(line.amount)
      }
    })
    return out
  }

  /**
   * Add changes to the current stock.
   * @param changes
   */
  apply(changes: Record<AccountCode, StockDataRecord>) {
    Object.keys(changes).forEach(account => {
      Object.keys(changes[account]).forEach(ticker => {
        this.addAsset(account as AccountCode, ticker as Asset, changes[account][ticker].amount, changes[account][ticker].value)
      })
    })
  }

  toJSON(decimalsToString = false): JsonValue {
    return toJSON(this.stock, decimalsToString)
  }
}
