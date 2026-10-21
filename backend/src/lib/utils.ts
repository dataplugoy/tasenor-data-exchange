import { Options, parse } from 'csv-parse'
import { JsonValue } from '@prisma/client/runtime/client'
import Decimal from 'decimal.js'

/**
 * Ensure number value is an Decimal instance.
 */
export function dec(value: string | number | Decimal | undefined): Decimal {
  if (value instanceof Decimal) {
    return value
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return new Decimal(value)
  }
  throw new Error(`Invalid value ${JSON.stringify(value)} to convert into Decimal instance.`)
}

/**
 * Convert decimals to strings.
 * @param value
 */
export function toJSON(value: unknown, decimalsToString = false): JsonValue {
  const type = typeof value
  if (value === null || value === undefined || type === 'string' || type === 'boolean' || type === 'number') {
    return value as JsonValue
  }
  if (type === 'object') {
    if (value instanceof Array) {
      return value.map(e => toJSON(e, decimalsToString))
    }
    if (value instanceof Decimal) {
      return decimalsToString ? value.toString() : value.toNumber()
    }

    return Object.keys(value as Object).reduce((prev, cur) => (
      typeof (value as Object)[cur] === 'function'
        ? prev
        : {
            ...prev,
            [cur]: toJSON((value as Object)[cur], decimalsToString)
          }),
    {}
    )
  }

  throw new Error(`Invalid type ${type}.`)
}

/**
 * Generate a string with + or - sign prefix for numeric value.
 * @param value
 */
export function chg(value: string | number | Decimal | undefined): string {
  const num = dec(value)
  return num.isNegative() ? num.toString() : '+' + num.toString()
}

/**
 * Round a monetary value to whole cents as it is booked. Halves are rounded towards positive infinity
 * like `Math.round()` does in the bookkeeper.
 * @param value
 */
export function cents(value: string | number | Decimal | undefined): Decimal {
  return dec(value).toDecimalPlaces(2, Decimal.ROUND_HALF_CEIL)
}

/**
 * Calculate the cost of taking some amount out of the stock at its average value.
 * The cost is rounded to cents as a negative stock change like the bookkeeper does.
 * @param stockValue
 * @param stockAmount
 * @param amount
 */
export function stockCost(stockValue: Decimal, stockAmount: Decimal, amount: string | number | Decimal | undefined): Decimal {
  return cents(stockValue.div(stockAmount).mul(dec(amount)).negated()).negated()
}

/**
   * Convert chardet encoding to the supported buffer encoding
   * "ascii" | "utf8" | "utf-8" | "utf16le" | "ucs2" | "ucs-2" | "base64" | "latin1" | "binary" | "hex"
   */
export function parseEncoding(encoding: string): 'ascii' | 'utf8' | 'utf-8' | 'utf16le' | 'ucs2' | 'ucs-2' | 'base64' | 'latin1' | 'binary' | 'hex' {
  switch (encoding.toUpperCase()) {
    case 'ASCII':
    case 'UTF-8':
      return 'utf-8'
    case 'ISO-8859-2':
    case 'ISO-8859-1':
      return 'latin1'
    case 'UTF-16LE':
      return 'utf16le'
    default:
      throw new Error(`Not able to map text encoding ${encoding}.`)
  }
}

/**
 * Convert service provider name to uppercase and clean up.
 */
export function serviceName2Code(service: string): string {
  return service.toUpperCase().replace(/[^A-Z0-9_]/g, '_')
}

/**
 * Read in a CSV file.
 * @param path
 * @param options
 * @returns
 */
export async function parseCsv(data: string, options: Options = {}): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const records: string[][] = []
    const parser = parse(options)

    parser.on('readable', function() {
      let record
      while ((record = parser.read()) !== null) {
        records.push(record)
      }
    })

    parser.on('end', function() {
      resolve(records)
    })

    parser.on('error', function(err) {
      reject(new Error(`CSV Parser failed: ${err.message}`))
    })
    parser.write(data)
    parser.end()
  })
}
