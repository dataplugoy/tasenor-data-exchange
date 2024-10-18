import { Language, Timestring } from '@tasenor/common'
import { DateTime } from 'luxon'
import { sprintf } from 'sprintf-js'

/**
 * Clock time to string.
 * @param date
 * @param language
 * @returns
 */
export function time2str(date: Timestring, language: Language): string {
  return DateTime.fromISO(date).toLocaleString(DateTime.TIME_WITH_SECONDS, { locale: language })
}

/**
 * Date to string.
 * @param date
 * @param language
 * @returns
 */
export function date2str(date: Timestring, language: Language): string {
  return DateTime.fromISO(date).toLocaleString(DateTime.DATE_SHORT, { locale: language })
}

/**
 * Both data eand time to string.
 * @param date
 * @param language
 * @returns
 */
export function datetime2str(date: Timestring, language: Language): string {
  return DateTime.fromISO(date).toLocaleString(DateTime.DATETIME_FULL, { locale: language })
}

/**
 * Stringify positive change of value.
 * @param num
 * @param asset
 * @param _language
 * @returns
 */
export function added2str(num: number | string | undefined, asset: string, _language: Language): string {
  if (num === undefined) {
    return `+${asset}`
  }
  return `+${num} ${asset}`
}

/**
 * Stringify negative change of value.
 * @param num
 * @param asset
 * @param _language
 * @returns
 */
export function subtracted2str(num: number | string | undefined, asset: string, _language: Language): string {
  if (num === undefined) {
    return `-${asset}`
  }
  const neg = typeof num === 'number' ? (num < 0) : num.startsWith('-')
  return `${neg ? '' : '−'}${num} ${asset}`
}

/**
 * Localize numeric value.
 * @param num
 * @param language
 */
export function num2str(num: number | string, _language: Language): string {
  const numeric = typeof num === 'string' ? parseFloat(num) : num
  return numeric + ''
}

/**
 * Convert money amount to string.
 * @param amount
 * @param type
 * @returns
 */
export function money(amount: number | string): string {
  if (amount === '') {
    return ''
  }
  const numeric = typeof amount === 'string' ? parseFloat(amount) : amount
  return `${sprintf('%.2f', numeric)}`
}

/**
 * Convert money amount to string if it is positive or zero.
 * @param amount
 * @param type
 * @returns
 */
export function debit(amount: number | string): string {
  const numeric = typeof amount === 'string' ? parseFloat(amount) : amount
  if (numeric >= 0) {
    return money(amount)
  }
  return ''
}

/**
 * Convert money amount to string if it is negative.
 * @param amount
 * @param type
 * @returns
 */
export function credit(amount: number | string): string {
  if (typeof amount === 'string') {
    if (amount.trim().substring(0, 1) === '-') {
      return money(amount.replace(/^\s*-/, ''))
    }
    return ''
  }
  if (amount < 0) {
    return money(-amount)
  }
  return ''
}
