import Decimal from 'decimal.js'

/**
 * Ensure number value is an Decimal instance.
 */
export function dec(value: string | number | Decimal): Decimal {
  if (value instanceof Decimal) {
    return value
  }
  if (typeof value === 'string' || typeof value === 'number' ) {
    return new Decimal(value)
  }
  throw new Error(`Invalud value ${JSON.stringify(value)} to convert into Decimal instance.`)
}
