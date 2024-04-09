import { DateTime } from 'luxon'
import { UnifiedInput } from '../../types/UnifiedInput'
import { AccountCode, Transaction } from '../../types/Transaction'
import { Analyzer } from './Analyzer'
import { dec } from '../utils'
import { Timestring } from '@tasenor/common'

/**
 * Buy an asset and add it to the stock.
 *
 * @param stock
 * @param time
 * @param input
 */
export async function buy(analyzer: Analyzer, time: DateTime, input: UnifiedInput): Promise<Transaction> {
  // TODO: Resolve asset values at time stamp.
  const rates = { ETH: 3351.86 }
  // TODO: Need to pass currency.
  const currency = 'EUR'
  // TODO: Handle fee.
  // TODO: Handle various cases of missing value.

  const { value, assetIn, assetAmountIn } = input
  // TODO: Basic checks to be done elsewhere commonly.
  if (!value) {
    throw new Error(`Asset valution not yet implemented for '${assetIn}'.`)
  }
  if (!assetIn) {
    throw new Error(`Buying has to define 'assetIn': ${JSON.stringify(input)}`)
  }
  if (assetAmountIn === undefined) {
    throw new Error(`Buying has to define 'assetAmountIn': ${JSON.stringify(input)}`)
  }
  if (dec(value).isNegative()) {
    throw new Error(`Total 'value' cannot be negative: ${JSON.stringify(input)}`)
  }
  // TODO: Generate localized text if no text to be found.
  const text = input.text
  if (!text) {
    throw new Error(`Text generation not yet implemented: ${JSON.stringify(input)}`)
  }

  return {
    time: time.toUTC().toISO() as Timestring,
    lines: [
      {
        account: `CURRENCY_${currency}` as AccountCode,
        amount: dec(value).negated(),
        text,
        extras: {},
      },
      {
        account: `ASSET_${assetIn}` as AccountCode,
        amount: dec(value),
        text,
        extras: {
          asset: assetIn,
          assetChange: dec(assetAmountIn),
        },
      },
    ]
  }
}
