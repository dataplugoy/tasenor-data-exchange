/**
 * Parser for Coinbase transaction exports.
 *
 * Coinbase has changed its export several times:
 * - v1: Coinbase Pro account report `portfolio,type,time,amount,balance,...` where one trade is two `match` rows and
 *   a `fee` row with the same trade id.
 * - v2: Transaction report with a long preamble and one row per transaction.
 * - v3: Transaction report with a short preamble.
 * - v4: Like v3 with an `ID` column, prices with currency symbols and signed amounts.
 */
import { parse } from 'csv-parse/sync'
import { createHash } from 'crypto'
import { isCurrency } from '@tasenor/common'
import { InputItemData } from '../types/API/InputItemData'

export type CoinbaseVersion = 1 | 2 | 3 | 4

const V1_HEADER = 'portfolio,type,time,amount,balance,amount/balance unit,transfer id,trade id,order id'

/**
 * Normalized row of any version.
 */
export type CoinbaseRow = {
  line: number
  raw: string
  fields: Record<string, string>
}

/**
 * Find the version of the export and the line index of its header.
 */
export function coinbaseVersion(text: string): { version: CoinbaseVersion, header: number } | null {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/)
  if (lines[0].trim() === V1_HEADER) {
    return { version: 1, header: 0 }
  }
  const header = lines.findIndex(l => /^(ID,)?Timestamp,Transaction Type,Asset,Quantity Transacted,/.test(l))
  if (header < 0 || !lines.slice(0, header).some(l => /^Transactions/.test(l))) {
    return null
  }
  if (lines[header].startsWith('ID,')) {
    return { version: 4, header }
  }
  return { version: header > 4 ? 2 : 3, header }
}

/**
 * Parse a number or money like `-€1296.03908`, `2,350.00` or `0.0009197001794225178686861089970715`.
 */
export function coinbaseNumber(s: string | undefined): number {
  if (s === undefined || s.trim() === '') {
    return 0
  }
  const clean = s.trim().replace(/[€$£,\s]/g, '')
  const n = parseFloat(clean)
  if (isNaN(n) || !/^-?\d*\.?\d+(e-?\d+)?$/i.test(clean)) {
    throw new Error(`Invalid number ${JSON.stringify(s)} in Coinbase export.`)
  }
  return n
}

/**
 * Convert `2023-12-30T10:00:46Z`, `2024-03-11 17:09:31 UTC` or `2019-06-20T06:11:49.583Z` to ISO time.
 */
export function coinbaseTime(s: string): string {
  const m = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})(\.\d+)?\s*(Z|UTC)$/.exec(s.trim())
  if (!m) {
    throw new Error(`Invalid time ${JSON.stringify(s)} in Coinbase export.`)
  }
  return `${m[1]}T${m[2]}${(m[3] || '.000').padEnd(4, '0').substring(0, 4)}Z`
}

/**
 * Read the data rows of the export with the header names as field names.
 */
export function parseCoinbaseRows(text: string): { version: CoinbaseVersion, rows: CoinbaseRow[] } {
  const found = coinbaseVersion(text)
  if (!found) {
    throw new Error('The file is not a Coinbase transaction export.')
  }
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/)
  const header: string[] = parse(lines[found.header])[0]
  const rows: CoinbaseRow[] = []
  for (let idx = found.header + 1; idx < lines.length; idx++) {
    if (lines[idx].trim() === '') continue
    const values: string[] = parse(lines[idx], { relax_column_count: true })[0] || []
    const fields: Record<string, string> = {}
    header.forEach((name, i) => { fields[name] = values[i] ?? '' })
    rows.push({ line: idx + 1, raw: lines[idx], fields })
  }
  return { version: found.version, rows }
}

/**
 * Drop floating point noise from sums and absolute values.
 */
function round(n: number): number {
  return parseFloat(n.toPrecision(15))
}

function item(version: CoinbaseVersion, rows: CoinbaseRow[], time: string, text: string, total: number, fields: Record<string, unknown>): InputItemData {
  return {
    line: rows[0].line,
    version,
    original: rows.map(r => r.raw).join('\n'),
    time,
    text,
    total: round(total),
    fields,
  }
}

/**
 * Items of the Coinbase Pro account report, combining the rows of one trade or transfer.
 */
function v1Items(rows: CoinbaseRow[]): InputItemData[] {
  const items: InputItemData[] = []
  const groups: Record<string, CoinbaseRow[]> = {}
  const order: string[] = []
  for (const row of rows) {
    const f = row.fields
    const key = f['trade id'] ? `trade:${f['trade id']}` : f['transfer id'] ? `transfer:${f['transfer id']}` : `line:${row.line}`
    if (!groups[key]) {
      groups[key] = []
      order.push(key)
    }
    groups[key].push(row)
  }

  for (const key of order) {
    const list = groups[key]
    const time = coinbaseTime(list[0].fields.time)
    const type = list[0].fields.type
    if (type === 'deposit' || type === 'withdrawal') {
      const amount = coinbaseNumber(list[0].fields.amount)
      const asset = list[0].fields['amount/balance unit']
      items.push(item(1, list, time, `${type === 'deposit' ? 'Deposit' : 'Withdrawal'} ${Math.abs(amount)} ${asset}`, amount, {
        Id: key,
        Kind: type === 'deposit' ? 'Deposit' : 'Withdrawal',
        Type: type,
        Asset: asset,
        Quantity: Math.abs(amount),
      }))
      continue
    }
    const matches = list.filter(r => r.fields.type === 'match')
    const fees = list.filter(r => r.fields.type === 'fee')
    const give = matches.filter(r => coinbaseNumber(r.fields.amount) < 0)
    const get = matches.filter(r => coinbaseNumber(r.fields.amount) > 0)
    const assetOf = (r: CoinbaseRow[]) => r.length ? r[0].fields['amount/balance unit'] : ''
    const sum = (r: CoinbaseRow[]) => round(Math.abs(r.reduce((s, x) => s + coinbaseNumber(x.fields.amount), 0)))
    if (!give.length || !get.length || new Set(give.map(r => r.fields['amount/balance unit'])).size > 1 || new Set(get.map(r => r.fields['amount/balance unit'])).size > 1 || new Set(fees.map(r => r.fields['amount/balance unit'])).size > 1) {
      throw new Error(`Cannot understand Coinbase trade ${key} on line ${list[0].line}.`)
    }
    const [giveAsset, getAsset, feeAsset] = [assetOf(give), assetOf(get), assetOf(fees)]
    const [giveQuantity, getQuantity, fee] = [sum(give), sum(get), sum(fees)]
    if (isCurrency(giveAsset) || isCurrency(getAsset)) {
      const buy = isCurrency(giveAsset)
      const currency = buy ? giveAsset : getAsset
      const asset = buy ? getAsset : giveAsset
      const quantity = buy ? getQuantity : giveQuantity
      const value = buy ? giveQuantity : getQuantity
      if (feeAsset && feeAsset !== currency) {
        throw new Error(`Unexpected fee asset ${feeAsset} in Coinbase trade ${key} on line ${list[0].line}.`)
      }
      items.push(item(1, list, time, `${buy ? 'Bought' : 'Sold'} ${quantity} ${asset} for ${value} ${currency}`, buy ? -(value + fee) : value - fee, {
        Id: key,
        Kind: buy ? 'Buy' : 'Sell',
        Type: 'match',
        Asset: asset,
        Quantity: quantity,
        Currency: currency,
        Value: value,
        Fee: fee,
        Total: round(buy ? value + fee : value - fee),
      }))
    } else {
      items.push(item(1, list, time, `Traded ${giveQuantity} ${giveAsset} to ${getQuantity} ${getAsset}`, 0, {
        Id: key,
        Kind: 'Trade',
        Type: 'match',
        GiveAsset: giveAsset,
        GiveQuantity: giveQuantity,
        GetAsset: getAsset,
        GetQuantity: getQuantity,
        GiveValue: null,
        GetValue: null,
        Currency: null,
        Fee: fee,
        FeeAsset: feeAsset || null,
      }))
    }
  }
  return items
}

/**
 * Items of the transaction reports, one row per transaction.
 */
function reportItems(version: CoinbaseVersion, rows: CoinbaseRow[]): InputItemData[] {
  const items: InputItemData[] = []
  const seen: Record<string, number> = {}
  for (const row of rows) {
    const f = row.fields
    const type = f['Transaction Type']
    const asset = f.Asset
    const quantity = round(Math.abs(coinbaseNumber(f['Quantity Transacted'])))
    const currency = f['Price Currency'] || f['Spot Price Currency']
    const price = Math.abs(coinbaseNumber(f['Price at Transaction'] ?? f['Spot Price at Transaction']))
    const subtotal = round(Math.abs(coinbaseNumber(f.Subtotal)))
    const total = round(Math.abs(coinbaseNumber(f['Total (inclusive of fees and/or spread)'])))
    const fee = round(Math.abs(coinbaseNumber(f['Fees and/or Spread'])))
    const notes = f.Notes || ''
    const time = coinbaseTime(f.Timestamp)

    // Sale of fiat for the same fiat accompanies a sale of crypto and has no effect.
    if (type === 'Sell' && isCurrency(asset)) {
      continue
    }

    let id = f.ID
    if (!id) {
      id = createHash('sha1').update(JSON.stringify([f.Timestamp, type, asset, f['Quantity Transacted'], notes])).digest('hex')
      seen[id] = (seen[id] || 0) + 1
      if (seen[id] > 1) id = `${id}:${seen[id]}`
    }

    const common = { Id: id, Type: type }
    let m
    if ((m = /^(Bought|Sold) ([0-9.,]+) (\S+) for ([0-9.,]+) (\S+) on \S+ at /.exec(notes)) && type.startsWith('Advanced Trade')) {
      const bought = m[1] === 'Bought'
      const [, , qty, first, otherQty, other] = m
      if (first !== asset) {
        throw new Error(`Unexpected notes ${JSON.stringify(notes)} for ${asset} on line ${row.line}.`)
      }
      if (isCurrency(other)) {
        items.push(item(version, [row], time, notes, bought ? -total : total, {
          ...common,
          Kind: bought ? 'Buy' : 'Sell',
          Asset: asset,
          Quantity: coinbaseNumber(qty),
          Currency: other,
          Value: subtotal,
          Fee: fee,
          Total: total,
        }))
      } else {
        // The quantity of the quote asset includes the fee. Values are in the price currency.
        items.push(item(version, [row], time, notes, 0, {
          ...common,
          Kind: 'Trade',
          GiveAsset: bought ? other : asset,
          GiveQuantity: bought ? coinbaseNumber(otherQty) : coinbaseNumber(qty),
          GetAsset: bought ? asset : other,
          GetQuantity: bought ? coinbaseNumber(qty) : coinbaseNumber(otherQty),
          GiveValue: bought ? total : subtotal,
          GetValue: bought ? subtotal : total,
          Currency: currency,
          Fee: fee,
          FeeAsset: currency,
        }))
      }
      continue
    }
    if (type === 'Convert') {
      const c = /^Converted ([0-9.,]+) (\S+) to ([0-9.,]+) (\S+)/.exec(notes)
      if (!c || c[2] !== asset) {
        throw new Error(`Unexpected notes ${JSON.stringify(notes)} for conversion on line ${row.line}.`)
      }
      items.push(item(version, [row], time, notes, 0, {
        ...common,
        Kind: 'Trade',
        GiveAsset: c[2],
        GiveQuantity: coinbaseNumber(c[1]),
        GetAsset: c[4],
        GetQuantity: coinbaseNumber(c[3]),
        GiveValue: total,
        GetValue: subtotal,
        Currency: currency,
        Fee: fee,
        FeeAsset: currency,
      }))
      continue
    }
    if (type === 'Buy' || type === 'Sell') {
      const buy = type === 'Buy'
      items.push(item(version, [row], time, notes, buy ? -total : total, {
        ...common,
        Kind: buy ? 'Buy' : 'Sell',
        Asset: asset,
        Quantity: quantity,
        Currency: currency,
        Value: subtotal,
        Fee: fee,
        Total: total,
      }))
      continue
    }
    if (/Reward|Staking Income|Inflation Reward/i.test(type)) {
      items.push(item(version, [row], time, notes, 0, {
        ...common,
        Kind: 'Reward',
        Asset: asset,
        Quantity: quantity,
        Currency: currency,
        Price: price,
        Value: subtotal,
      }))
      continue
    }
    if (type === 'Send' || type === 'Receive') {
      items.push(item(version, [row], time, notes, 0, {
        ...common,
        Kind: type,
        Asset: asset,
        Quantity: quantity,
        Currency: currency,
        Price: price,
        Value: subtotal,
      }))
      continue
    }
    if (type === 'Deposit' || type === 'Withdrawal') {
      items.push(item(version, [row], time, `${type} ${quantity} ${asset}`, type === 'Deposit' ? quantity : -quantity, {
        ...common,
        Kind: type,
        Asset: asset,
        Quantity: quantity,
      }))
      continue
    }
    throw new Error(`Unsupported Coinbase transaction type ${JSON.stringify(type)} on line ${row.line}.`)
  }
  return items
}

/**
 * Convert the export to input items, one item per economic event, sorted by time.
 *
 * Every item has an `Id` identifying the event, which stays the same in other exports covering it. Quantities and
 * values are positive, the direction comes from `Kind`:
 * - `Buy` / `Sell`: `Asset` and `Quantity` for `Value` (without fee) in `Currency`, `Fee` and `Total` paid or received.
 * - `Trade`: `GiveAsset`/`GiveQuantity` for `GetAsset`/`GetQuantity` with their values `GiveValue`/`GetValue` in
 *   `Currency`, if known. In v1 the `Fee` is a quantity of `FeeAsset` charged separately. In later versions the
 *   `Fee` is its value in `Currency` and it is already included in the given quantity.
 * - `Reward`, `Send`, `Receive`: `Asset` and `Quantity` with `Price` and `Value` in `Currency`.
 * - `Deposit` / `Withdrawal`: `Asset` and `Quantity`.
 */
export function coinbaseItems(text: string): InputItemData[] {
  const { version, rows } = parseCoinbaseRows(text)
  const items = version === 1 ? v1Items(rows) : reportItems(version, rows)
  return items.sort((a, b) => a.time < b.time ? -1 : a.time > b.time ? 1 : (a.line || 0) - (b.line || 0))
}
