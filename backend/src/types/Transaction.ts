import { Asset, Timestring } from '@tasenor/common'
import Decimal from 'decimal.js'
import { DateTime } from 'luxon'

export type AccountCode = 'TODO'

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
