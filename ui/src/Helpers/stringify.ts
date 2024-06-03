import { Language, Timestring } from '@tasenor/common'
import { DateTime } from 'luxon'

export function time2str(date: Timestring, language: Language): string {
  return DateTime.fromISO(date).toLocaleString(DateTime.TIME_WITH_SECONDS, { locale: language })
}

export function date2str(date: Timestring, language: Language): string {
  return DateTime.fromISO(date).toLocaleString(DateTime.DATE_SHORT, { locale: language })
}

export function datetime2str(date: Timestring, language: Language): string {
  return DateTime.fromISO(date).toLocaleString(DateTime.DATETIME_FULL, { locale: language })
}

export function added2str(num: number | string, asset: string, _language: Language): string {
  return `+${num} ${asset}`
}
