import { Asset, CryptoCurrency, Currency, Language, isCurrency } from '@tasenor/common'
import { t } from '../i18n/t'
import { dec } from '../utils'
import { Analyzer } from './Analyzer'
import Decimal from 'decimal.js'
import { UnifiedItemData } from '../../types/API/UnifiedItem'
import { AccountCode } from '../../types/AccountCode'
import { AnswersRequired } from '../../exceptions/AnswersRequired'

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

  return t(this.language, text, values as Record<string, string>)
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

  const [prefix, body] = asset.split(':')
  const queryAsset = (body === undefined ? asset : body) as Asset

  if (this.currency === queryAsset) {
    return new Decimal(1.0)
  }

  if (canUseService) {
    let rate

    if (isCurrency(asset) || prefix === 'CURRENCY') {
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

    if (rate !== undefined) {
      return rate.value
    }
  }

  this.validateError(`Cannot resolve rate for an asset ${asset}`)
}

/**
 * Resolve value of an assets.
 */
export async function validateAsset(this: Analyzer, asset: Asset | undefined, amount: number | Decimal | undefined, canUseService: boolean = false): Promise<Decimal> {
  if (asset === undefined) {
    this.validateError('Cannot figure out value without asset')
  }
  if (amount === undefined) {
    this.validateError('Cannot figure out value without amount of the asset')
  }

  const rate = await this.validateRate(asset, canUseService)
  return rate.mul(dec(amount))
}

/**
 * Resolve total value from assets if not given explicitly.
 */
export async function validateValueOrAsset(this: Analyzer, asset: Asset | undefined = undefined, amount: number | Decimal | undefined = undefined, canUseService: boolean = false): Promise<Decimal> {
  const input = this.validateInput()
  if (input.value !== undefined && input.value !== null) {
    return dec(input.value)
  }
  return this.validateAsset(asset, amount, canUseService)
}

/**
 * Ensure that value is given.
 */
export async function validateValue(this: Analyzer, canUseService: boolean = false): Promise<Decimal> {
  const input = this.validateInput()
  if (input.value !== undefined && input.value !== null) {
    if (input.valueAsset && input.valueAsset !== this.currency) {
      const rate = await this.validateRate(input.valueAsset as Asset, canUseService)
      return rate.mul(dec(input.value))
    }
    return dec(input.value)
  }
  this.validateError('Value is missing')
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

/**
 * Figure out main account which is either based on `valueAsset` or default currency.
 */
export function validateValueAccount(this: Analyzer, withService: boolean): AccountCode {
  const input = this.validateInput()
  if (input.valueAsset === '') {
    throw new Error(`Invalid empty valueAsset in ${JSON.stringify(input)}.`)
  }
  if (input.valueAsset === undefined) {
    return `CURRENCY_${this.currency}` as AccountCode
  }
  if (isCurrency(input.valueAsset)) {
    return `CURRENCY_${input.valueAsset}` as AccountCode
  }
  return `ASSET_${input.valueAsset}` as AccountCode
}

/**
 * Figure out asset out account.
 */
export function validateAssetOutAccount(this: Analyzer, withService: boolean): AccountCode {
  const input = this.validateInput()
  if (!input.assetOut) {
    this.validateError("Cannot figure asset out account without 'assetOut'")
  }
  if (isCurrency(input.assetOut)) {
    return `CURRENCY_${input.assetOut}` as AccountCode
  }
  return `ASSET_${input.assetOut}` as AccountCode
}

/**
 * Figure out asset in account.
 */
export function validateAssetInAccount(this: Analyzer, withService: boolean): AccountCode {
  const input = this.validateInput()
  if (!input.assetIn) {
    this.validateError("Cannot figure asset out account without 'assetIn'")
  }
  if (isCurrency(input.assetIn)) {
    return `CURRENCY_${input.assetIn}` as AccountCode
  }
  return `ASSET_${input.assetIn}` as AccountCode
}

/**
 * Check that asset seems to be valid ticker. Apply ticker mapping if found for the ticker.
 * @param this
 * @param asset
 */
export function validateTicker(this: Analyzer, asset: string): Asset {
  const suspicious = (t: string): boolean => {
    // Some special valid cases.
    if (/\b(BULL|BEAR|LONG|SHORT|SHRT)\b/.test(t) && /[- :A-Z._0-9]/.test(t)) {
      return false
    }
    // Invalid characters.
    if (/[^- :A-Z._0-9]/.test(t)) {
      return true
    }
    // More than 1 space.
    if (t.split(' ').length > 2) {
      return true
    }
    // Longer than 6 characters.
    if (t.length > 6) {
      return true
    }

    return false
  }

  if (this.setup.tickers && this.setup.tickers[asset]) {
    return this.setup.tickers[asset] as Asset
  }

  if (suspicious(asset)) {
    AnswersRequired.forTicker(`/flow-plans/${this.runtimeOptions.flowPlanId}/configure`, this.config.language as Language, this.runtimeOptions.userId, asset)
  }

  return asset as Asset
}
