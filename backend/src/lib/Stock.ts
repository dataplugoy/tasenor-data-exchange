import { Asset } from "@tasenor/common";
import Decimal from "decimal.js";

export type StockData = Partial<Record<Asset, {
  amount: Decimal
  value: Decimal
}>>

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

  apply(change: StockChangeData) {
    console.log('TODO:', change)
  }
}
