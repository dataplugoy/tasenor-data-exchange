import { Asset } from '@tasenor/common'
import { t } from '../i18n/t'
import { dec } from '../utils'
import { Analyzer } from './Analyzer'
import Decimal from 'decimal.js'
import { UnifiedItemData } from '../../types/API/UnifiedItem'

/**
 * Throw a validation error.
 * @param msg
 */
export function validateError(this: Analyzer, msg: string): never {
  throw new Error(`${msg}: ${JSON.stringify(this.lastInput)}`)
}

/**
 * Ensure that input is set.
 * @param this
 */
export function validateInput(this: Analyzer): UnifiedItemData {
  if (!this.lastInput) {
    throw new Error('Cannot use validation before setting the last input.')
  }
  return this.lastInput
}

/**
 * Do standard validations for input.
 */
export function validateBasics(this: Analyzer): void {
  const input = this.validateInput()

  if (input.value !== undefined && dec(input.value).isNegative()) {
    this.validateError(`Total value ${input.value} cannot be negative.`)
  }
}

/**
 * Ensure the field exist in input.
 * @param field
 */
export function validateRequirdeField(this: Analyzer, field: keyof UnifiedItemData): void {
  const input = this.validateInput()
  if (input[field] === undefined) {
    this.validateError(`The field '${field}' is required`)
  }
}

/**
 * Ensure all fields exist in input.
 * @param fields
 */
export function validateRequired(this: Analyzer, ...fields: Array<keyof UnifiedItemData>): void {
  fields.forEach(field => this.validateRequirdeField(field))
}

/**
 * Use either explicit text or translate the given text.
 * @param text
 */
export function validateText(this: Analyzer, text: string, values: Record<string, string | undefined> = {}): string {
  const input = this.validateInput()
  if (input.text !== undefined) {
    return input.text
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
  const input = this.validateInput()
  if (!input.rates || !(asset in input.rates)) {
    this.validateError(`Cannot resolve rate for an asset ${asset}`)
  }
  return dec(input.rates[asset])
}

/**
 * Resolve total value if not given explicitly.
 */
export async function validateValue(asset: Asset | undefined = undefined, amount: number | Decimal | undefined = undefined): Promise<Decimal> {
  const input = this.validateInput()
  if (input.value !== undefined) {
    return dec(input.value)
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
