import { DateTime } from 'luxon'
import Decimal from 'decimal.js'
import { Analyzer } from '../Analyzer'
import { chg, dec } from '../../utils'
import { Asset, Timestring } from '@tasenor/common'
import { UnifiedItemData } from '../../../types/API/UnifiedItemData'
import { Transaction } from '../../../types/API/Transaction'
import { AccountCode } from '../../../types/AccountCode'

/**
 * Move an asset between this service and an own wallet elsewhere without realizing profit or loss.
 *
 * The own wallet is the account `WALLET_<asset>` or the given `account`. The asset moves at its average cost. When
 * receiving more than known to be in the wallet, the cost of the received amount is the `value` of the item.
 *
 * @param time
 * @param input
 *
 * Requires fields `assetOut`, `assetAmountOut`, `assetTypeOut` for sending or `assetIn`, `assetAmountIn`, `assetTypeIn`
 * for receiving. For receiving, `value` (with `valueAsset`) is needed if the wallet does not have the asset.
 */
export async function transfer(this: Analyzer, time: DateTime, input: UnifiedItemData): Promise<Transaction> {

  this.validateBasics()

  const sending = !!input.assetOut
  if (sending) {
    this.validateRequired('assetOut', 'assetAmountOut', 'assetTypeOut')
  } else {
    this.validateRequired('assetIn', 'assetAmountIn', 'assetTypeIn')
  }
  const ticker = this.validateTicker((sending ? input.assetOut : input.assetIn) as string)
  const amount = dec(sending ? input.assetAmountOut : input.assetAmountIn)
  const account = `${sending ? input.assetTypeOut : input.assetTypeIn}_${ticker}` as AccountCode
  const wallet = (input.account || `WALLET_${ticker}`) as AccountCode

  // Cost at the average of the source.
  const source = this.stock.getAsset(this.resolveAccount(sending ? account : wallet), ticker as Asset)
  let cost: Decimal
  if (source.amount.gte(amount)) {
    cost = source.value.div(source.amount).mul(amount)
  } else if (sending) {
    this.validateError(`Cannot send ${amount} ${ticker} when having only ${source.amount}`)
  } else {
    cost = await this.validateValueOrAsset(ticker, amount, true)
  }

  const text = this.validateText(sending ? 'Sent {{amount}} {{asset}} to own wallet' : 'Received {{amount}} {{asset}} from own wallet', {
    asset: ticker,
    amount: chg(sending ? amount.negated() : amount),
  })

  const [from, to] = sending ? [account, wallet] : [wallet, account]
  return {
    time: time.toUTC().toISO() as Timestring,
    lines: [
      {
        account: from,
        amount: cost.negated().toString(),
        text,
        extras: {
          asset: ticker,
          assetChange: amount.negated().toString(),
        },
      },
      {
        account: to,
        amount: cost.toString(),
        text,
        extras: {
          asset: ticker,
          assetChange: amount.toString(),
        },
      },
    ]
  }
}
