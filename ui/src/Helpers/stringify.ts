import { Language, Timestring } from '@tasenor/common'
import { DateTime } from 'luxon'
import { sprintf } from 'sprintf-js'

export function time2str(date: Timestring, language: Language): string {
  return DateTime.fromISO(date).toLocaleString(DateTime.TIME_WITH_SECONDS, { locale: language })
}

export function date2str(date: Timestring, language: Language): string {
  return DateTime.fromISO(date).toLocaleString(DateTime.DATE_SHORT, { locale: language })
}

export function datetime2str(date: Timestring, language: Language): string {
  return DateTime.fromISO(date).toLocaleString(DateTime.DATETIME_FULL, { locale: language })
}

export function added2str(num: number | string | undefined, asset: string, _language: Language): string {
  if (num === undefined) {
    return `+${asset}`
  }
  return `+${num} ${asset}`
}

export function subtracted2str(num: number | string | undefined, asset: string, _language: Language): string {
  if (num === undefined) {
    return `-${asset}`
  }
  const neg = typeof num === 'number' ? (num < 0) : num.startsWith('-')
  return `${neg ? '' : '−'}${num} ${asset}`
}

export function money(amount: number | string, type: 'debit' | 'credit'): string {
  if (amount === '') {
    return ''
  }
  const numeric = typeof amount === 'string' ? parseFloat(amount) : amount
  if (type === 'debit') {
    return numeric >= 0 ? `${sprintf('%.2f', numeric)}` : ''
  }
  return numeric < 0 ? `${sprintf('%.2f', Math.abs(numeric))}` : ''
}
