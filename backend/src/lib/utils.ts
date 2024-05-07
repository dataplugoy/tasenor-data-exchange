import { JsonValue } from '@prisma/client/runtime/library'
import Decimal from 'decimal.js'
import clone from 'clone'

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
      return value.map(e => toJSON(e))
    }
    if (value instanceof Decimal) {
      return decimalsToString ? value.toString() : value.toNumber()
    }

    return Object.keys(value as Object).reduce((prev, cur) => (
      typeof (value as Object)[cur] === 'function'
        ? prev
        : {
            ...prev,
            [cur]: toJSON((value as Object)[cur])
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
   * Convert chardet encoding to the supported buffer encoding
   * "ascii" | "utf8" | "utf-8" | "utf16le" | "ucs2" | "ucs-2" | "base64" | "latin1" | "binary" | "hex"
   */
export function parseEncoding(encoding: string): 'ascii' | 'utf8' | 'utf-8' | 'utf16le' | 'ucs2' | 'ucs-2' | 'base64' | 'latin1' | 'binary' | 'hex' {
  switch (encoding.toUpperCase()) {
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
