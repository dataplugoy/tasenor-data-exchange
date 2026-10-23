import { Setup } from '../../types/API/Setup'
import { AccountCode } from '../../types/AccountCode'

export const VARIABLE_MAP = {
  FEE: 'singleFeeAccount',
  TAX: 'singleTaxAccount',
  LOSS: 'singleLossAccount',
  STOCK: 'singleStockAccount',
  CRYPTO: 'singleCryptoAccount',
  EXPENSE: 'singleExpenseAccount',
  INCOME: 'singleIncomeAccount',
  PROFIT: 'singleProfitAccount',
  DIVIDEND: 'singleDividendAccount',
}

/**
 * Based on the setup, decide the final account code for a one account.
 * @param setup
 * @param code
 */
export function resolveAccount(setup: Setup, code: AccountCode): AccountCode {

  const start = code.replace(/^([A-Z]+)_.*/, '$1')
  const v = VARIABLE_MAP[start]
  if (v && setup.accountGrouping && setup.accountGrouping[VARIABLE_MAP[start]]) {
    return start as AccountCode
  }

  return code.replace(/ /g, '_').toUpperCase() as AccountCode
}

/**
 * Based on the setup, decide the final account code and possible additional specifier for a one account.
 * @param setup
 * @param code
 */
export function splitAccount(code: AccountCode): [AccountCode, string | null] {

  const match = /^([A-Z]+)_(.*)/.exec(code)
  return match === null ? [code, null] : [match[1] as AccountCode, match[2]]
}
