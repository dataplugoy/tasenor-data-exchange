import Opaque from 'ts-opaque'
import { Asset, Timestring } from '@tasenor/common'
import Decimal from 'decimal.js'

// TODO: Split this file.

export type AccountCode = Opaque<string, 'AccountCode'>

export interface TransactionExtras {
  asset?: Asset
  assetChange?: Decimal
}

export interface TransactionLine {
  account: AccountCode
  amount: Decimal
  text: string
  extras: TransactionExtras
}

export interface Transaction {
  time: Timestring
  lines: TransactionLine[]
}
