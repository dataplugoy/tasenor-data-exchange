import { Timestring } from '@tasenor/common'
import { DateTime } from 'luxon'
import { sprintf } from 'sprintf-js'

export function dateFI(s: string): Timestring {
  const r = /^(\d+)\.(\d+)\.(\d+)$/.exec(s)
  if (r) {
    const day = sprintf('%04d-%02d-%02d', parseInt(r[3]), parseInt(r[2]), parseInt(r[1]))
    return DateTime.fromISO(`${day}T12:00:00Z`).toUTC().toISO() as Timestring
  } else {
    throw new Error(`Unable to parse date ${JSON.stringify(s)}`)
  }
}
