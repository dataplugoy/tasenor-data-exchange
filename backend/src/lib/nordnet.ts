/**
 * Helpers for Nordnet transaction lists.
 */

/**
 * Cash or a position in the transaction list, in its own currency.
 */
export type NordnetHolding = {
  currency: string
  security?: string
  amount: number
  cost?: number
}

/**
 * Description of a position that cannot be worked out.
 */
export type NordnetUnknown = {
  security: string
  type: string
}

type Row = Record<string, unknown>

/**
 * Get a number from a field, which is either converted already or still in the format `-1 234,56`.
 */
function num(value: unknown): number {
  if (typeof value === 'number') {
    return value
  }
  const n = parseFloat(`${value ?? ''}`.replace(/[\s\u00a0]/g, '').replace(',', '.'))
  return isNaN(n) ? 0 : n
}

/**
 * Check if the row reports the quantity and the cost of the position after it.
 */
function isPositionRow(row: Row): boolean {
  const type = `${row.Tapahtumatyyppi}`
  return !!row.Arvopaperi && (type === 'OSTO' || type === 'MYYNTI' || type.includes('JÄTTÖ') || type.includes('OTTO'))
}

/**
 * Find the cash and the positions before the rows dated on or after `firstDate`. Every row tells the cash balance of
 * its currency after the row. The rows changing a position tell the quantity and the cost of the position after the
 * row. The state before a row is worked out from the change of the row, or taken from the last row before the date.
 * Positions not changed in the list cannot be known.
 * @param records The fields of the rows in any order.
 * @param firstDate
 * @param currency The currency of the rows without one.
 * @returns The date of the values, the cash per currency, the positions and the positions that cannot be worked
 * out, or null if there are no rows.
 */
export function nordnetOpening(records: Row[], firstDate: string, currency: string): { date: string, cash: NordnetHolding[], positions: NordnetHolding[], unknown: NordnetUnknown[] } | null {
  if (records.length === 0) {
    return null
  }
  const rows = [...records].sort((a, b) => {
    const date = `${a.Kirjauspäivä}`.localeCompare(`${b.Kirjauspäivä}`)
    return date !== 0 ? date : parseInt(`${a.Id}`) - parseInt(`${b.Id}`)
  })
  const start = `${rows[0].Kirjauspäivä}`
  const date = firstDate > start ? firstDate : start
  const before = (row: Row) => `${row.Kirjauspäivä}` < date
  const currencyOf = (row: Row, field: string): string => `${row[field] || row.Valuutta || currency}`

  // Cash before the first row of the date or after the last row before it.
  const cash: Record<string, number> = {}
  for (const c of new Set(rows.map(row => currencyOf(row, 'Valuutta')))) {
    const own = rows.filter(row => currencyOf(row, 'Valuutta') === c)
    const first = own.find(row => !before(row))
    cash[c] = first ? num(first.Saldo) - num(first.Summa) : num(own[own.length - 1].Saldo)
  }

  const positions: NordnetHolding[] = []
  const unknown: NordnetUnknown[] = []
  for (const security of new Set(rows.filter(isPositionRow).map(row => `${row.Arvopaperi}`))) {
    const own = rows.filter(row => isPositionRow(row) && row.Arvopaperi === security)
    const last = own.filter(before).pop()
    if (last) {
      positions.push({ currency: currencyOf(last, 'Hankinta-arvo Valuutta'), security, amount: num(last.Kokonaismäärä), cost: num(last['Hankinta-arvo']) })
      continue
    }
    const first = own[0]
    const type = `${first.Tapahtumatyyppi}`
    const costCurrency = currencyOf(first, 'Hankinta-arvo Valuutta')
    const quantity = num(first.Kokonaismäärä)
    const cost = num(first['Hankinta-arvo'])
    if (costCurrency !== currencyOf(first, 'Valuutta') || type.includes('OTTO')) {
      unknown.push({ security, type })
    } else if (type === 'OSTO') {
      positions.push({ currency: costCurrency, security, amount: quantity - num(first.Määrä), cost: cost + num(first.Summa) })
    } else if (type === 'MYYNTI') {
      positions.push({ currency: costCurrency, security, amount: quantity + num(first.Määrä), cost: cost + num(first.Summa) - num(first.Tulos) })
    } else {
      positions.push({ currency: costCurrency, security, amount: quantity - num(first.Määrä), cost: cost - num(first.Summa) })
    }
  }

  return {
    date,
    cash: Object.entries(cash).map(([currency, amount]) => ({ currency, amount: Math.round(amount * 100) / 100 })),
    positions: positions.filter(pos => pos.amount !== 0).map(pos => ({ ...pos, cost: Math.round((pos.cost || 0) * 100) / 100 })),
    unknown,
  }
}
