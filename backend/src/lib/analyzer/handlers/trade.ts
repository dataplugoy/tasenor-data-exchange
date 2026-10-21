import { DateTime } from 'luxon'
import { Analyzer } from '../Analyzer'
import { chg, dec, stockCost } from '../../utils'
import { Timestring } from '@tasenor/common'
import { UnifiedItemData } from '../../../types/API/UnifiedItemData'
import { Transaction, TransactionLine } from '../../../types/API/Transaction'
import { AccountCode } from '../../../types/AccountCode'

/**
 * Exchange an asset to another asset without money, like in a merger or a crypto-to-crypto trade.
 *
 * The given asset leaves the stock at its average cost and the received asset enters at the value of the trade.
 * The difference is realized as profit or loss of the given asset.
 *
 * @param time
 * @param input
 *
 * Requires fields `assetOut`, `assetAmountOut`, `assetTypeOut`, `assetIn`, `assetAmountIn`, `assetTypeIn`.
 * The value of the received amount is `value` (with `valueAsset`) or, if not given, from the rate of the received asset.
 * Optional `fee` with `feeAsset` for the fee of the trade. The given amount or the received amount is expected to
 * reflect the fee already, i.e. the fee is part of the exchange and the result is `value + fee - cost`.
 */
export async function trade(this: Analyzer, time: DateTime, input: UnifiedItemData): Promise<Transaction> {

  this.validateBasics()
  this.validateRequired('assetOut', 'assetAmountOut', 'assetTypeOut', 'assetIn', 'assetAmountIn', 'assetTypeIn')

  const { assetOut, assetAmountOut, assetTypeOut, assetIn, assetAmountIn, assetTypeIn } = input
  const tickerOut = this.validateTicker(assetOut as string)
  const tickerIn = this.validateTicker(assetIn as string)
  const value = await this.validateValueOrAsset(tickerIn, dec(assetAmountIn), true)
  const [fee, feeAsset] = await this.validateFee(true)

  const accountOut = this.resolveAccount(`${assetTypeOut}_${tickerOut}`)
  const old = this.stock.getAsset(accountOut, tickerOut)
  if (old.amount.lt(dec(assetAmountOut))) {
    this.validateError(`Cannot give ${assetAmountOut} ${tickerOut} when having only ${old.amount}`)
  }
  const cost = stockCost(old.value, old.amount, assetAmountOut)

  const text = this.validateText('Exchanged {{out}} {{outAsset}} to {{in}} {{inAsset}}', {
    out: chg(dec(assetAmountOut).negated()),
    outAsset: tickerOut,
    in: chg(assetAmountIn),
    inAsset: tickerIn,
  })

  const lines: TransactionLine[] = [
    {
      account: `${assetTypeOut}_${tickerOut}` as AccountCode,
      amount: cost.negated().toString(),
      text,
      extras: {
        asset: tickerOut,
        assetChange: dec(assetAmountOut).negated().toString(),
      },
    },
    {
      account: `${assetTypeIn}_${tickerIn}` as AccountCode,
      amount: value.toString(),
      text,
      extras: {
        asset: tickerIn,
        assetChange: dec(assetAmountIn).toString(),
      },
    },
  ]

  if (!fee.isZero()) {
    lines.push({
      account: `FEE_${feeAsset || this.currency}` as AccountCode,
      amount: fee.toString(),
      text,
      extras: {},
    })
  }

  // Market value of the given asset.
  const price = value.plus(fee)
  if (price.gt(cost)) {
    lines.push({
      account: `PROFIT_${tickerOut}` as AccountCode,
      amount: price.minus(cost).negated().toString(),
      text,
      extras: {},
    })
  }

  if (cost.gt(price)) {
    lines.push({
      account: `LOSS_${tickerOut}` as AccountCode,
      amount: cost.minus(price).toString(),
      text,
      extras: {},
    })
  }

  return {
    time: time.toUTC().toISO() as Timestring,
    lines
  }
}
