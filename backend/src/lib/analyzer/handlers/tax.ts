import Decimal from 'decimal.js'
import { Asset } from '@tasenor/common'
import { Analyzer } from '../Analyzer'
import { dec } from '../../utils'
import { UnifiedItemData } from '../../../types/API/UnifiedItemData'
import { AccountCode } from '../../../types/AccountCode'

/**
 * Tax of an income or expense item and the account for it.
 */
export type TaxInfo = {
  tax: Decimal
  account: AccountCode | null
}

/**
 * Resolve the tax of an income or expense item.
 *
 * The tax is given either as `taxAmount` in `taxAsset` (default: the value asset) or as `taxPercentage`, which is
 * the percentage of tax included in the value (VAT). VAT goes to the purchase or sales VAT account according to the
 * category of the item, so that refunds reduce the same VAT they were booked with.
 *
 * @param value Value of the item in the home currency.
 * @param account The account of the item.
 */
export async function resolveTax(analyzer: Analyzer, input: UnifiedItemData, value: Decimal, account: AccountCode): Promise<TaxInfo> {
  const { taxType, taxAmount, taxPercentage, valueAsset } = input
  if (!taxType) {
    return { tax: new Decimal(0), account: null }
  }

  let tax: Decimal
  if (taxAmount !== undefined && taxAmount !== null) {
    const taxAsset = (input.taxAsset || valueAsset || analyzer.currency) as Asset
    tax = await analyzer.validateAsset(taxAsset, dec(taxAmount), true)
  } else if (taxPercentage !== undefined && taxPercentage !== null) {
    const p = dec(taxPercentage)
    if (p.lte(0) || p.gte(100)) {
      analyzer.validateError(`Invalid tax percentage ${taxPercentage}.`)
    }
    tax = value.mul(p).div(p.plus(100)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
  } else {
    analyzer.validateError('Either taxAmount or taxPercentage is required.')
  }

  if (taxType === 'vat') {
    const purchase = /^EXPENSE_/.test(account) || (!/^INCOME_/.test(account) && input.type === 'expense')
    return { tax, account: (purchase ? 'TAX_VAT_FROM_PURCHASES' : 'TAX_VAT_FROM_SALES') as AccountCode }
  }

  return { tax, account: `TAX_${taxType.toUpperCase()}` as AccountCode }
}
