import { Asset, CryptoCurrency, Currency, isCurrency } from '@tasenor/common'
// TODO: This is not working well. Need a function to give explicit language instead. Remove from here.
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

  if (input.value !== undefined && input.value !== null && dec(input.value).isNegative()) {
    this.validateError(`Total value ${input.value} cannot be negative.`)
  }
}

/**
 * Ensure the field exist in input.
 * @param field
 */
export function validateRequiredField(this: Analyzer, field: keyof UnifiedItemData): void {
  const input = this.validateInput()
  if (input[field] === undefined) {
    this.validateError(`The field '${field}' is required`)
  }
}

/**
 * Ensure the field exist in input and is not empty.
 * @param field
 */
export function validateNotEmpty(this: Analyzer, field: keyof UnifiedItemData): void {
  const input = this.validateInput()
  if (input[field] === undefined) {
    this.validateError(`The field '${field}' is required`)
  }
  if (input[field]?.toString().trim() === '') {
    this.validateError(`The field '${field}' must have content`)
  }
}

/**
 * Ensure all fields exist in input.
 * @param fields
 */
export function validateRequired(this: Analyzer, ...fields: Array<keyof UnifiedItemData>): void {
  fields.forEach(field => this.validateRequiredField(field))
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
export async function validateRate(this: Analyzer, asset: Asset, canUseService: boolean): Promise<Decimal> {
  const input = this.validateInput()
  if (input.rates && (asset in input.rates)) {
    return dec(input.rates[asset] as string | number | Decimal)
  }

  if (canUseService) {
    let rate
    const [prefix, body] = asset.split(':')
    const queryAsset = (body === undefined ? asset : body) as Asset

    if (isCurrency(asset) || prefix === 'CURRENCY') {
      if (this.currency === queryAsset) {
        return new Decimal(1.0)
      }
      rate = await this.askService({
        query: 'CURRENCY_RATES',
        time: this.lastTime,
        currency: queryAsset as Currency,
        valueCurrency: this.currency
      })

    } else {
      rate = await this.askService({
        query: 'CRYPTO_RATES',
        time: this.lastTime,
        asset: queryAsset as CryptoCurrency,
        valueCurrency: this.currency
      })
    }

    if (rate) {
      return rate.value
    }
  }

  this.validateError(`Cannot resolve rate for an asset ${asset}`)
}

/**
 * Resolve total value from assets if not given explicitly.
 */
export async function validateValueOrAsset(this: Analyzer, asset: Asset | undefined = undefined, amount: number | Decimal | undefined = undefined, canUseService: boolean = false): Promise<Decimal> {
  const input = this.validateInput()
  if (input.value !== undefined && input.value !== null) {
    return dec(input.value)
  }
  if (asset === undefined) {
    this.validateError(`Cannot figure out value without any asset`)
  }
  if (amount === undefined) {
    this.validateError(`Cannot figure out value without amount of the asset`)
  }

  const rate = await this.validateRate(asset, canUseService)
  return rate.mul(dec(amount))
}

/**
 * Ensure that value is given.
 */
export async function validateValue(this: Analyzer): Promise<Decimal> {
  const input = this.validateInput()
  if (input.value !== undefined && input.value !== null) {
    return dec(input.value)
  }
  this.validateError(`Value is missing`)
}

/**
 * Check if the fee is given and calculate its value, determine asset used. Asset change returned if relevant.
 */
export async function validateFee(this: Analyzer, canUseService: boolean): Promise<[Decimal, Asset | null, Decimal | null]> {
  const input = this.validateInput()
  if (input.fee === undefined) {
    return [new Decimal(0), null, null]
  }
  const fee = new Decimal(input.fee)
  if (input.feeAsset !== undefined && input.feeAsset !== this.currency) {
    const rate = await this.validateRate(input.feeAsset as Asset, canUseService)
    return [rate.mul(fee), input.feeAsset as Asset, fee]
  }
  return [new Decimal(input.fee), null, null]
}
