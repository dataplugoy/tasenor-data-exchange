/**
 * Parser for Lynx (Interactive Brokers) Activity Statement CSV.
 *
 * The statement consists of sections. Every row starts with the section name and the row type (Header, Data,
 * SubTotal, Total, Notes). Each section has its own header row, some sections have more than one.
 */
import { parse } from 'csv-parse/sync'
import { InputItemData } from '../types/API/InputItemData'

export type LynxRow = {
  section: string
  line: number
  raw: string
  fields: Record<string, string>
}

// Sections used. Others (positions, summaries, accruals and duplicates of these) are ignored.
const SECTIONS = new Set(['Trades', 'Dividends', 'Withholding Tax', 'Deposits & Withdrawals', 'Interest', 'Fees', 'Corporate Actions'])

// Sections repeated later in the statement with an extra Code column. Only the first block is used.
const FIRST_BLOCK_ONLY = new Set(['Dividends', 'Deposits & Withdrawals'])

const SECURITY = /^\s*([-A-Za-z0-9 .]+?)\s*\(([A-Z0-9]+)\)/

/**
 * Check if the text looks like a Lynx Activity Statement.
 */
export function isLynx(text: string): boolean {
  return text.replace(/^\uFEFF/, '').startsWith('Statement,Header,Field Name,Field Value')
}

/**
 * Parse a number possibly having thousands separators.
 */
export function lynxNumber(s: string | undefined): number {
  if (s === undefined || s.trim() === '' || s.trim() === '--') {
    return 0
  }
  const n = parseFloat(s.replace(/,/g, ''))
  if (isNaN(n)) {
    throw new Error(`Invalid number ${JSON.stringify(s)} in Lynx statement.`)
  }
  return n
}

/**
 * Convert `2022-02-15, 11:00:23` or `2022-02-15` to ISO time.
 */
export function lynxTime(s: string): string {
  const m = /^(\d{4}-\d{2}-\d{2})(?:,?\s*(\d{2}:\d{2}:\d{2}))?$/.exec(s.trim())
  if (!m) {
    throw new Error(`Invalid date ${JSON.stringify(s)} in Lynx statement.`)
  }
  return m[2] ? `${m[1]}T${m[2]}.000Z` : `${m[1]}T12:00:00.000Z`
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/**
 * Find the period `January 1, 2022 - December 31, 2022` of the statement as ISO dates.
 */
export function lynxPeriod(text: string): { start: string, end: string } | null {
  const m = /^Statement,Data,Period,"?([^"\r\n]*)"?\r?$/m.exec(text.replace(/^\uFEFF/, ''))
  if (!m) return null
  const dates = m[1].split(' - ').map(d => {
    const parts = /^([A-Za-z]+) (\d{1,2}), (\d{4})$/.exec(d.trim())
    const month = parts ? MONTHS.indexOf(parts[1]) + 1 : 0
    if (!parts || !month) {
      throw new Error(`Invalid statement period ${JSON.stringify(m[1])} in Lynx statement.`)
    }
    return `${parts[3]}-${String(month).padStart(2, '0')}-${parts[2].padStart(2, '0')}`
  })
  return { start: dates[0], end: dates[dates.length - 1] }
}

/**
 * Split the statement to data rows of the used sections with their fields named by the section headers.
 */
export function parseLynxRows(text: string): LynxRow[] {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/)
  const rows: LynxRow[] = []
  const headers: Record<string, string[]> = {}
  const blocks: Record<string, number> = {}
  let previous = ''

  // Rows never span lines. Lines are parsed one by one, since unused sections may contain malformed quoting.
  lines.forEach((line, idx) => {
    if (line.trim() === '') return
    const section = line.startsWith('"') ? (/^"([^"]*)"/.exec(line) || ['', ''])[1] : line.substring(0, line.indexOf(','))
    if (section !== previous) {
      blocks[section] = (blocks[section] || 0) + 1
      previous = section
    }
    if (!SECTIONS.has(section)) return
    if (FIRST_BLOCK_ONLY.has(section) && blocks[section] > 1) return
    const record: string[] = parse(line, { relax_column_count: true, relax_quotes: true })[0] || []
    const [, type, ...values] = record
    if (type === 'Header') {
      headers[section] = values
      return
    }
    if (type !== 'Data') return
    const header = headers[section]
    if (!header) {
      throw new Error(`Data row before header in section ${section} of Lynx statement.`)
    }
    // Totals are marked as data with 'Total' in the first column.
    if (/^Total/.test(values[0] || '') || /^Total/.test(values[1] || '')) return
    const fields: Record<string, string> = {}
    header.forEach((name, i) => {
      if (name !== '') fields[name] = values[i] ?? ''
    })
    // Forex trades have their own header: normalize to the names of stock trades.
    if ('Comm in EUR' in fields) {
      fields['Comm/Fee'] = fields['Comm in EUR']
      delete fields['Comm in EUR']
    }
    if (section === 'Trades' && fields.DataDiscriminator !== 'Order') return
    rows.push({ section, line: idx + 1, raw: line, fields })
  })

  return rows
}

/**
 * Parse `TICKER(ISIN) ...` from a description.
 */
export function security(description: string): { symbol: string, isin: string } | null {
  const m = SECURITY.exec(description)
  return m ? { symbol: m[1].trim(), isin: m[2] } : null
}

/**
 * Parse dividend per share from a description.
 */
function perShare(description: string): number | null {
  const m = /(\d+(?:\.\d+)?) per Share/.exec(description) || /Cash Dividend [A-Z]{3} (\d+(?:\.\d+)?)/.exec(description)
  return m ? parseFloat(m[1]) : null
}

type CorporateLeg = { symbol: string, isin: string, quantity: number, value: number }

/**
 * Parse a corporate action description.
 */
function corporateAction(description: string): { action: string, ratio: [number, number] | null, leg: { symbol: string, isin: string } } {
  let action = 'Unknown'
  if (/CUSIP\/ISIN Change/.test(description)) action = 'IsinChange'
  else if (/Stock Dividend/.test(description)) action = 'StockDividend'
  else if (/\) Split /.test(description)) action = 'Split'
  else if (/\) Spinoff /.test(description)) action = 'Spinoff'
  else if (/\) Merged/.test(description)) action = 'Merger'
  const ratio = /(\d+) (?:for|FOR) (\d+)/.exec(description.replace(/^.*?\)/, ''))
  // The instrument of the leg is the last parenthesized list: (SYMBOL, NAME, ISIN).
  const lists = [...description.matchAll(/\(([^()]*,[^()]*)\)/g)]
  const parts = lists.length ? lists[lists.length - 1][1].split(',').map(s => s.trim()) : []
  return {
    action,
    ratio: ratio ? [parseInt(ratio[1]), parseInt(ratio[2])] : null,
    leg: { symbol: parts[0] || '', isin: parts[parts.length - 1] || '' },
  }
}

function item(key: string, rows: LynxRow[], time: string, text: string, total: number, fields: Record<string, unknown>): InputItemData {
  return {
    line: rows[0].line,
    version: 1,
    original: rows.map(r => r.raw).join('\n'),
    time,
    text,
    total,
    fields: { Key: key, ...fields },
  }
}

/**
 * Convert rows to input items, one item per economic event.
 *
 * - Trades, forex, deposits, withdrawals, interest and fees: one row is one item.
 * - Dividends: all dividend rows (incl. payments in lieu of dividend) and withholding tax rows of the same date and
 *   instrument are summed to one item.
 * - Withholding tax rows without a dividend on the same date are summed per date and instrument to adjustment items.
 *   Adjustments are dated to the dividend. When that is before the statement period, they are booked on the first
 *   day of the period, since that is the closest known date of the actual cash movement.
 * - Corporate actions: legs with the same time, instrument and action are combined.
 *
 * Each item has a `Key` identifying the event, which stays the same in other statements covering it.
 */
export function lynxItems(rows: LynxRow[], periodStart: string | null = null): InputItemData[] {
  const items: InputItemData[] = []

  // Dividends and taxes.
  const dividends: Record<string, LynxRow[]> = {}
  const taxes: Record<string, LynxRow[]> = {}
  for (const row of rows) {
    if (row.section !== 'Dividends' && row.section !== 'Withholding Tax') continue
    const sec = security(row.fields.Description)
    if (!sec) {
      throw new Error(`Cannot find the instrument in ${JSON.stringify(row.fields.Description)} on line ${row.line}.`)
    }
    const key = `${row.fields.Date}:${sec.isin}`
    const target = row.section === 'Dividends' ? dividends : taxes
    target[key] = target[key] || []
    target[key].push(row)
  }
  for (const [key, list] of Object.entries(dividends)) {
    const sec = security(list[0].fields.Description) as { symbol: string, isin: string }
    const amount = list.reduce((sum, r) => sum + lynxNumber(r.fields.Amount), 0)
    const taxRows = taxes[key] || []
    const tax = taxRows.reduce((sum, r) => sum + lynxNumber(r.fields.Amount), 0)
    delete taxes[key]
    const description = list[0].fields.Description
    items.push(item(`Dividend:${key}`, [...list, ...taxRows], lynxTime(list[0].fields.Date), description, round(amount + tax), {
      Kind: 'Dividend',
      Currency: list[0].fields.Currency,
      Date: list[0].fields.Date,
      Symbol: sec.symbol,
      ISIN: sec.isin,
      Amount: round(amount),
      Tax: round(tax),
      PerShare: perShare(description),
      PaymentInLieu: list.some(r => /Payment in Lieu/i.test(r.fields.Description)),
      ReturnOfCapital: list.some(r => /Return of Capital/i.test(r.fields.Description)),
      Description: description,
    }))
  }
  for (const [key, list] of Object.entries(taxes)) {
    const sec = security(list[0].fields.Description) as { symbol: string, isin: string }
    const amount = list.reduce((sum, r) => sum + lynxNumber(r.fields.Amount), 0)
    const date = periodStart && list[0].fields.Date < periodStart ? periodStart : list[0].fields.Date
    items.push(item(`TaxAdjustment:${key}`, list, lynxTime(date), list[0].fields.Description, round(amount), {
      Kind: 'TaxAdjustment',
      Currency: list[0].fields.Currency,
      Date: list[0].fields.Date,
      Symbol: sec.symbol,
      ISIN: sec.isin,
      Amount: round(amount),
      Description: list[0].fields.Description,
    }))
  }

  // Corporate actions.
  const actions: Record<string, { rows: LynxRow[], action: string, ratio: [number, number] | null, legs: CorporateLeg[] }> = {}
  for (const row of rows) {
    if (row.section !== 'Corporate Actions') continue
    const sec = security(row.fields.Description)
    const parsed = corporateAction(row.fields.Description)
    const key = `${row.fields['Date/Time']}:${sec ? sec.isin : ''}:${parsed.action}`
    actions[key] = actions[key] || { rows: [], action: parsed.action, ratio: parsed.ratio, legs: [] }
    actions[key].rows.push(row)
    actions[key].legs.push({ ...parsed.leg, quantity: lynxNumber(row.fields.Quantity), value: lynxNumber(row.fields.Value) })
  }
  for (const [key, action] of Object.entries(actions)) {
    const sec = security(action.rows[0].fields.Description)
    const out = action.legs.filter(l => l.quantity < 0)
    const into = action.legs.filter(l => l.quantity > 0)
    items.push(item(`CorporateAction:${key}`, action.rows, lynxTime(action.rows[0].fields['Date/Time']), action.rows[0].fields.Description, 0, {
      Kind: 'CorporateAction',
      Action: action.action,
      Currency: action.rows[0].fields.Currency,
      Symbol: sec ? sec.symbol : '',
      ISIN: sec ? sec.isin : '',
      RatioNew: action.ratio ? action.ratio[0] : null,
      RatioOld: action.ratio ? action.ratio[1] : null,
      OutSymbol: out.length ? out[0].symbol : null,
      OutQuantity: out.length ? -out[0].quantity : null,
      InSymbol: into.length ? into[0].symbol : null,
      InQuantity: into.length ? into[0].quantity : null,
      Value: round(action.legs.reduce((sum, l) => sum + l.value, 0)),
      Legs: action.legs.length,
      Description: action.rows[0].fields.Description,
    }))
  }

  // Other sections, one row per item.
  for (const row of rows) {
    const f = row.fields
    switch (row.section) {
      case 'Trades': {
        const quantity = lynxNumber(f.Quantity)
        if (f['Asset Category'] === 'Forex') {
          const [base, quote] = f.Symbol.split('.')
          items.push(item(`Forex:${f['Date/Time']}:${f.Symbol}:${quantity}`, [row], lynxTime(f['Date/Time']), `${quantity > 0 ? 'Buy' : 'Sell'} ${base} for ${quote}`, lynxNumber(f.Proceeds), {
            Kind: 'Forex',
            Base: base,
            Quote: quote,
            Quantity: quantity,
            Price: lynxNumber(f['T. Price']),
            Proceeds: lynxNumber(f.Proceeds),
            Fee: lynxNumber(f['Comm/Fee']),
            FeeCurrency: base,
            // Result of the exchange in the base currency compared to the closing rate of the day.
            Profit: lynxNumber(f['MTM in EUR']),
            Code: f.Code || '',
          }))
        } else {
          items.push(item(`Trade:${f['Date/Time']}:${f.Symbol}:${quantity}:${f['T. Price']}:${f.Code || ''}`, [row], lynxTime(f['Date/Time']), `${quantity > 0 ? 'Buy' : 'Sell'} ${f.Symbol}`, lynxNumber(f.Proceeds), {
            Kind: 'Trade',
            AssetCategory: f['Asset Category'],
            Currency: f.Currency,
            Symbol: f.Symbol,
            Quantity: quantity,
            Price: lynxNumber(f['T. Price']),
            Proceeds: lynxNumber(f.Proceeds),
            Fee: lynxNumber(f['Comm/Fee']),
            RealizedPL: lynxNumber(f['Realized P/L']),
            Code: f.Code || '',
          }))
        }
        break
      }
      case 'Deposits & Withdrawals': {
        const amount = lynxNumber(f.Amount)
        const kind = /^Adjustment:/.test(f.Description) ? 'TransferAdjustment' : amount >= 0 ? 'Deposit' : 'Withdrawal'
        items.push(item(`${kind}:${f['Settle Date']}:${f.Currency}:${amount}:${f.Description}`, [row], lynxTime(f['Settle Date']), f.Description, amount, {
          Kind: kind,
          Currency: f.Currency,
          Amount: amount,
          Description: f.Description,
        }))
        break
      }
      case 'Interest': {
        const amount = lynxNumber(f.Amount)
        const month = /for ([A-Za-z]{3}-\d{4})/.exec(f.Description)
        items.push(item(`Interest:${f.Date}:${f.Currency}:${f.Description}`, [row], lynxTime(f.Date), f.Description, amount, {
          Kind: 'Interest',
          Currency: f.Currency,
          Amount: amount,
          Month: month ? month[1] : '',
          Description: f.Description,
        }))
        break
      }
      case 'Fees': {
        const amount = lynxNumber(f.Amount)
        items.push(item(`Fee:${f.Date}:${f.Currency}:${amount}:${f.Description}`, [row], lynxTime(f.Date), f.Description, amount, {
          Kind: 'Fee',
          Currency: f.Currency,
          Amount: amount,
          Description: f.Description,
        }))
        break
      }
    }
  }

  // Identical events within the statement get a running number to keep keys unique. The order of rows is the same
  // in every statement, so the keys stay stable.
  const seen: Record<string, number> = {}
  for (const it of items) {
    const key = it.fields.Key as string
    seen[key] = (seen[key] || 0) + 1
    if (seen[key] > 1) {
      it.fields.Key = `${key}:${seen[key]}`
    }
  }

  return items.sort((a, b) => a.time < b.time ? -1 : a.time > b.time ? 1 : (a.line || 0) - (b.line || 0))
}

function round(n: number): number {
  return Math.round(n * 1e8) / 1e8
}
