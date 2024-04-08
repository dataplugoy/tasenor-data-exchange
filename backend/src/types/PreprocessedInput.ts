import { ShortDate, Timestring } from "@tasenor/common"

/**
 * Parsed storage format for incoming data extracted as a single unit of future processing.
 */
export interface PreprocessedInput {
  original: string
  line: number | null
  time: Timestring | ShortDate
  text: string | null
  total: number | null
  fields: {[k: string] : any}
}
