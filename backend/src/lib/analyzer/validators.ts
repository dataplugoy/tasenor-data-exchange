import { Asset } from '@tasenor/common'
import { UnifiedInput } from '../../types/UnifiedInput'
import { t } from '../i18n/t'
import { dec } from '../utils'
import { Analyzer } from './Analyzer'
import Decimal from 'decimal.js'

/**
 * Throw a validation error.
 * @param msg
 */
export function validateError(this: Analyzer, msg: string): never {
  throw new Error(`${msg}: ${JSON.stringify(this.lastInput)}`)
}

/**
 * Do standard validations for input.
 */
export function validateBasics(this: Analyzer): void {
  if (!this.lastInput) {
    throw new Error('Cannot use validation before setting the last input.')
  }
  if (this.lastInput.value !== undefined && dec(this.lastInput.value).isNegative()) {
    this.validateError(`Total value ${this.lastInput.value} cannot be negative.`)
  }
}

/**
 * Ensure the field exist in input.
 * @param field
 */
export function validateRequirdeField(this: Analyzer, field: keyof UnifiedInput): void {
  if (!this.lastInput) {
    throw new Error('Cannot use validation before setting the last input.')
  }
  if (this.lastInput[field] === undefined) {
    this.validateError(`The field '${field}' is required`)
  }
}

/**
 * Ensure all fields exist in input.
 * @param fields
 */
export function validateRequired(this: Analyzer, ...fields: Array<keyof UnifiedInput>): void {
  fields.forEach(field => this.validateRequirdeField(field))
}

/**
 * Use either explicit text or translate the given text.
 * @param text
 */
export function validateText(this: Analyzer, text: string, values: Record<string, string | undefined> = {}): string {
  if (!this.lastInput) {
    throw new Error('Cannot use validation before setting the last input.')
  }
  if (this.lastInput.text !== undefined) {
    return this.lastInput.text
  }
  Object.keys(values).forEach(k => {
    if (values[k] === undefined) {
      this.validateError(`A value for key '${k}' is undefined.`)
    }
  })

  return t(text, values as Record<string, string>)
}

/**
 * Get the rate in the default currency for an asset or throw an error.
 * @param asset
 */
export async function validateRate(asset: Asset): Promise<Decimal> {
  // TODO: DRY. Add validateInput()
  if (!this.lastInput) {
    throw new Error('Cannot use validation before setting the last input.')
  }

  if (!this.lastInput.rates || !(asset in this.lastInput.rates)) {
    this.validateError(`Cannot resolve rate for an asset ${asset}`)
  }

  return dec(this.lastInput.rates[asset])
}

/**
 * Resolve total value if not given explicitly.
 */
export async function validateValue(asset: Asset | undefined = undefined, amount: number | Decimal | undefined = undefined): Promise<Decimal> {
  if (!this.lastInput) {
    throw new Error('Cannot use validation before setting the last input.')
  }
  if (this.lastInput.value !== undefined) {
    return dec(this.lastInput.value)
  }
  if (asset === undefined) {
    this.validateError(`Cannot figure out value without any asset`)
  }
  if (amount === undefined) {
    this.validateError(`Cannot figure out value without amount of the asset`)
  }

  const rate = await this.validateRate(asset)
  return rate.mul(dec(amount))
}
