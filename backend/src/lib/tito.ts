/**
 * Parser for Nordea TITO bank statements (konekielinen tiliote).
 *
 * Based on https://www.nordea.fi/Images/146-84478/xml_tiliote.pdf and the TITO importer of Tasenor Bookkeeper.
 * Field names are the Finnish names used in the specification.
 */
import { InputItemData } from '../types/API/InputItemData'

export type TitoRecord = {
  type: string
  raw: string
  line: number
  fields: Record<string, string>
}

type Converter = (s: string) => string

const date: Converter = (s) => s.trim() === '' ? '' : `20${s.substring(0, 2)}-${s.substring(2, 4)}-${s.substring(4, 6)}`
const money: Converter = (s) => s.trim() === '' ? '' : `${parseInt(s) / 100}`
const integer: Converter = (s) => s.trim() === '' ? '' : `${parseInt(s)}`
const noZeros: Converter = (s) => s.replace(/^0+/, '')

/**
 * Parse fixed length fields and trim them.
 */
function fixed(s: string, lengths: Record<string, number>, converters: Record<string, Converter> = {}): Record<string, string> {
  const ret: Record<string, string> = {}
  let pos = 0
  for (const [name, len] of Object.entries(lengths)) {
    const value = s.substring(pos, pos + len).trim()
    ret[name] = converters[name] ? converters[name](value) : value
    pos += len
  }
  return ret
}

/**
 * Convert old 7-bit Nordic characters.
 */
function nordic(s: string): string {
  return s
    .replace(/\]/g, 'Å')
    .replace(/\[/g, 'Ä')
    .replace(/\\/g, 'Ö')
    .replace(/\}/g, 'å')
    .replace(/\{/g, 'ä')
    .replace(/\|/g, 'ö')
}

const PERIOD_FIELDS = {
  'Jakson tunnus': 1,
  Jaksopäivä: 6,
  'Panot Kappalemäärä': 8,
  'Panot Summa': 19,
  'Otot Kappalemäärä': 8,
  'Otot Summa': 19,
}
const PERIOD_CONVERTERS = {
  Jaksopäivä: date,
  'Panot Summa': money,
  'Panot Kappalemäärä': integer,
  'Otot Summa': money,
  'Otot Kappalemäärä': integer,
}

/**
 * Parse the fields of one record.
 */
function parseFields(type: string, body: string): Record<string, string> {
  switch (type) {
    case '00':
      return fixed(body, {
        Versionumero: 3,
        Tilinumero: 14,
        'Tiliotteen numero': 3,
        Tiliotekausi: 12,
        Muodostumisaika: 10,
        Asiakastunnus: 17,
        'Alkusaldon pvm': 6,
        'Tiliotteen alkusaldo': 19,
        'Tiliotteen tietueiden lukumäärä': 6,
        'Tilin valuutan tunnus': 3,
        'Tilin nimi': 30,
        'Tilin limiitti': 18,
        'Tilin omistajan nimi': 35,
        'Yhteydenottotieto-1': 40,
        'Yhteydenottotieto-2': 40,
        'Pankkikohtaista tietoa-1': 30,
        'Pankkikohtaista tietoa-2': 30,
      }, {
        'Alkusaldon pvm': date,
        'Tiliotteen alkusaldo': money,
        'Tiliotteen tietueiden lukumäärä': integer,
        'Tilin limiitti': money,
      })

    case '10':
      return fixed(body, {
        'Tapahtuman numero': 6,
        Arkistointitunnus: 18,
        Kirjauspäivä: 6,
        Arvopäivä: 6,
        Maksupäivä: 6,
        Tapahtumatunnus: 1,
        Koodi: 3,
        Seliteteksti: 35,
        'Tapahtuman rahamäärä': 19,
        Kuittikoodi: 1,
        Välitystapa: 1,
        'Saaja/Maksaja': 35,
        'Nimen lähde': 1,
        'Saajan tili': 14,
        'Tili muuttunut -tieto': 1,
        Viite: 20,
        'Lomakkeen numero': 8,
        Tasotunnus: 1,
      }, {
        Kirjauspäivä: date,
        Arvopäivä: date,
        Maksupäivä: date,
        Viite: noZeros,
        'Tapahtuman rahamäärä': money,
      })

    case '11': {
      const subType = body.substring(0, 2)
      const extras = body.substring(2)
      const fields: Record<string, string> = { 'Lisätiedon tyyppi': subType }
      const lines = (name: string) => Object.fromEntries([...Array(12).keys()].map(i => [`${name}-${i + 1}`, 35]))
      switch (subType) {
        case '00':
          return { ...fields, ...fixed(extras, lines('Viesti')) }
        case '03':
          return { ...fields, ...fixed(extras, { 'Kortin numero': 19, Tyhjää: 1, 'Kaupan arkistoviite': 14 }) }
        case '06':
          return {
            ...fields,
            ...fixed(extras, { 'Toimeksiantajan tieto-1': 35, 'Toimeksiantajan tieto-2': 35 }, {
              'Toimeksiantajan tieto-1': noZeros,
              'Toimeksiantajan tieto-2': noZeros,
            })
          }
        case '07':
          return { ...fields, ...fixed(extras, lines('Lisätieto')) }
        case '11':
          return { ...fields, ...fixed(extras, { 'Maksajan viite': 35 }) }
      }
      throw new Error(`Parsing a record of subtype '${subType}' is not implemented for record type 'T11'.`)
    }

    case '40':
      return fixed(body, {
        Kirjauspäivä: 6,
        'Kirjauspäivän loppusaldo': 19,
        'Käytettävissä oleva saldo': 19,
      }, {
        Kirjauspäivä: date,
        'Kirjauspäivän loppusaldo': money,
        'Käytettävissä oleva saldo': money,
      })

    case '50':
    case '51':
      return fixed(body, PERIOD_FIELDS, PERIOD_CONVERTERS)

    case '70':
      return fixed(body, { 'Pankkiryhmän tunnus': 3, Tiedote: 80 * 6 })
  }
  throw new Error(`Parsing a record of type 'T${type}' is not implemented.`)
}

/**
 * Check if the text looks like a TITO statement.
 */
export function isTito(text: string): boolean {
  return text.startsWith('T00322100')
}

/**
 * Split the statement to records and parse the fields of each record.
 */
export function parseTitoRecords(text: string): TitoRecord[] {
  const records: TitoRecord[] = []
  let line = 1
  for (let i = 0; i < text.length;) {
    if (text[i] !== 'T') {
      throw new Error(`Parsing TITO failed: missing 'T' at the beginning of record ${line}.`)
    }
    const len = parseInt(text.substring(i + 3, i + 6))
    if (isNaN(len) || len < 6) {
      throw new Error(`Parsing TITO failed: invalid length of record ${line}.`)
    }
    const raw = nordic(text.substring(i, i + len))
    const type = raw.substring(1, 3)
    records.push({ type, raw, line, fields: parseFields(type, raw.substring(6)) })
    line++
    i += len
    while (text.charCodeAt(i) === 10 || text.charCodeAt(i) === 13) {
      i++
    }
  }
  return records
}

/**
 * Join non-empty numbered fields like Viesti-1, Viesti-2, ...
 */
function joinLines(fields: Record<string, string>, name: string): string {
  return [...Array(12).keys()].map(i => fields[`${name}-${i + 1}`]).filter(s => s).join('\n')
}

/**
 * Append a text to a field separated by a new line.
 */
function append(fields: Record<string, string | number>, name: string, text: string): void {
  if (text) {
    fields[name] = fields[name] ? `${fields[name]}\n${text}` : text
  }
}

/**
 * Convert records to input items.
 *
 * One item is one transaction. A basic transaction record T10 and the additional information records T11
 * following it are combined. Itemization records (T10 with level 1) following the main T10 of the same archive id
 * are added to `Erittely`. Every item also gets the account number and currency of the statement it belongs to.
 * Records not describing transactions (balances, period totals, notices) do not produce items, but closing balances
 * of the booking days are checked against the transactions.
 */
export function titoItems(records: TitoRecord[]): InputItemData[] {
  const items: InputItemData[] = []
  let account: { Tilinumero: string, Valuutta: string, 'Tilin nimi': string } | null = null
  let balance = 0
  let current: InputItemData | null = null
  let detail = false
  let detailSum = 0

  const checkDetails = () => {
    if (current && current.fields.Erittely !== undefined && Math.round(detailSum * 100) !== Math.round((current.total as number) * 100)) {
      throw new Error(`Itemization of the transaction ${current.fields.Arkistointitunnus} sums to ${detailSum} instead of ${current.total}.`)
    }
  }

  for (const record of records) {
    const f = record.fields
    switch (record.type) {
      case '00':
        checkDetails()
        current = null
        account = { Tilinumero: f.Tilinumero, Valuutta: f['Tilin valuutan tunnus'], 'Tilin nimi': f['Tilin nimi'] }
        balance = parseFloat(f['Tiliotteen alkusaldo'] || '0')
        break

      case '10': {
        if (!account) {
          throw new Error(`Transaction record on line ${record.line} before the statement header.`)
        }
        const amount = parseFloat(f['Tapahtuman rahamäärä'])
        if (f.Tasotunnus === '1') {
          if (!current || current.fields.Arkistointitunnus !== f.Arkistointitunnus) {
            throw new Error(`Itemization record on line ${record.line} without the main transaction.`)
          }
          detail = true
          detailSum += amount
          append(current.fields as Record<string, string | number>, 'Erittely', `${f.Seliteteksti} ${amount.toFixed(2)}`)
          current.original += `\n${record.raw}`
          break
        }
        checkDetails()
        const { Tietuetunnus, ...fields } = f as Record<string, string | number>
        fields['Tapahtuman rahamäärä'] = amount
        current = {
          line: record.line,
          version: 1,
          original: record.raw,
          time: f.Kirjauspäivä,
          text: f.Seliteteksti,
          total: amount,
          fields: { ...fields, ...account },
        }
        detail = false
        detailSum = 0
        balance += amount
        items.push(current)
        break
      }

      case '11': {
        if (!current) {
          throw new Error(`Additional information record on line ${record.line} without a transaction.`)
        }
        current.original += `\n${record.raw}`
        const fields = current.fields as Record<string, string | number>
        switch (f['Lisätiedon tyyppi']) {
          case '00':
            append(fields, detail ? 'Erittely' : 'Viesti', joinLines(f, 'Viesti'))
            break
          case '03':
            fields['Kortin numero'] = f['Kortin numero']
            fields['Kaupan arkistoviite'] = f['Kaupan arkistoviite']
            break
          case '06':
            fields['Toimeksiantajan tieto-1'] = f['Toimeksiantajan tieto-1']
            fields['Toimeksiantajan tieto-2'] = f['Toimeksiantajan tieto-2']
            break
          case '07':
            append(fields, 'Lisätieto', joinLines(f, 'Lisätieto'))
            break
          case '11':
            fields['Maksajan viite'] = f['Maksajan viite']
            break
        }
        break
      }

      case '40':
        checkDetails()
        current = null
        if (Math.round(balance * 100) !== Math.round(parseFloat(f['Kirjauspäivän loppusaldo']) * 100)) {
          throw new Error(`Closing balance of ${account?.Tilinumero} on ${f.Kirjauspäivä} is ${f['Kirjauspäivän loppusaldo']} but transactions sum to ${balance.toFixed(2)}.`)
        }
        break

      default:
        checkDetails()
        current = null
    }
  }
  checkDetails()

  return items
}
