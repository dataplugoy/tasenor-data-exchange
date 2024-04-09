import { DateTime } from 'luxon'
import { UnifiedInput } from '../../types/UnifiedInput'
import { AccountCode, Transaction } from '../../types/Transaction'
import { Analyzer } from './Analyzer'
import { chg, dec } from '../utils'
import { Timestring } from '@tasenor/common'
import { t } from '../i18n/t'

/**
 * Buy an asset and add it to the stock.
 *
 * @param stock
 * @param time
 * @param input
 *
 * Requires fields `assetIn`, `assetAmountIn`.
 */
export async function buy(analyzer: Analyzer, time: DateTime, input: UnifiedInput): Promise<Transaction> {
  // TODO: Handle fee.
  const { assetIn, assetAmountIn } = input

  analyzer.validateBasics()
  analyzer.validateRequired('assetIn', 'assetAmountIn')
  const text = analyzer.validateText('Bought {{amount}} {{asset}}', { asset: assetIn, amount: chg(assetAmountIn) })
  const value = await analyzer.validateValue(assetIn, assetAmountIn)

  return {
    time: time.toUTC().toISO() as Timestring,
    lines: [
      {
        account: `CURRENCY_${analyzer.currency}` as AccountCode,
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
