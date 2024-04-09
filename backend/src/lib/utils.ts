import { JsonValue } from '@prisma/client/runtime/library'
import Decimal from 'decimal.js'

/**
 * Ensure number value is an Decimal instance.
 */
export function dec(value: string | number | Decimal | undefined): Decimal {
  if (value instanceof Decimal) {
    return value
  }
  if (typeof value === 'string' || typeof value === 'number' ) {
    return new Decimal(value)
  }
  throw new Error(`Invalud value ${JSON.stringify(value)} to convert into Decimal instance.`)
}

/**
 * Convert decimals to strings.
 * @param value
 */
export function toJSON(value: unknown): JsonValue {
  const type = typeof value
  if (value === null || type === 'string' || type === 'boolean' || type === 'number') {
    return value as JsonValue
  }
  if (type === 'object') {
    if (value instanceof Array) {
      return value.map(e => toJSON(e))
    }
    if (value instanceof Decimal) {
      return value.toNumber()
    }

    return Object.keys(value as Object).reduce((prev, cur) => (
      typeof (value as Object)[cur] === 'function' ? prev :
      {
        ...prev,
        [cur]: toJSON((value as Object)[cur])
      }),
      {}
    )
  }
  throw new Error(`Invalid type ${type}.`)
}