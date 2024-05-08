import { expect, test } from 'vitest'
import { resolveAccount } from '../../backend/src/lib/analyzer/resolver'
import { AccountCode } from '../../backend/src/types/AccountCode'

test('Account resolver shortening everything', async () => {
  const setup = {
    accountGrouping: {
      singleFeeAccount: true,
      singleTaxAccount: true,
      singleLossAccount: true,
      singleStockAccount: true,
      singleCryptoAccount: true,
      singleExpenseAccount: true,
      singleIncomeAccount: true,
      singleProfitAccount: true,
      singleDividendAccount: true
    }
  }

  expect(resolveAccount(setup, 'FEE_DUMMY' as AccountCode)).toBe('FEE')
  expect(resolveAccount(setup, 'TAX_DUMMY' as AccountCode)).toBe('TAX')
  expect(resolveAccount(setup, 'LOSS_DUMMY' as AccountCode)).toBe('LOSS')
  expect(resolveAccount(setup, 'STOCK_DUMMY' as AccountCode)).toBe('STOCK')
  expect(resolveAccount(setup, 'CRYPTO_DUMMY' as AccountCode)).toBe('CRYPTO')
  expect(resolveAccount(setup, 'EXPENSE_DUMMY' as AccountCode)).toBe('EXPENSE')
  expect(resolveAccount(setup, 'INCOME_DUMMY' as AccountCode)).toBe('INCOME')
  expect(resolveAccount(setup, 'PROFIT_DUMMY' as AccountCode)).toBe('PROFIT')
  expect(resolveAccount(setup, 'DIVIDEND_DUMMY' as AccountCode)).toBe('DIVIDEND')
})

test('Account resolver shortening nothing', async () => {
  const setup = {
    accountGrouping: {
      singleFeeAccount: false,
      singleTaxAccount: false,
      singleLossAccount: false,
      singleStockAccount: false,
      singleCryptoAccount: false,
      singleExpenseAccount: false,
      singleIncomeAccount: false,
      singleProfitAccount: false,
      singleDividendAccount: false
    }
  }

  expect(resolveAccount(setup, 'FEE_DUMMY' as AccountCode)).toBe('FEE_DUMMY')
  expect(resolveAccount(setup, 'TAX_DUMMY' as AccountCode)).toBe('TAX_DUMMY')
  expect(resolveAccount(setup, 'LOSS_DUMMY' as AccountCode)).toBe('LOSS_DUMMY')
  expect(resolveAccount(setup, 'STOCK_DUMMY' as AccountCode)).toBe('STOCK_DUMMY')
  expect(resolveAccount(setup, 'CRYPTO_DUMMY' as AccountCode)).toBe('CRYPTO_DUMMY')
  expect(resolveAccount(setup, 'EXPENSE_DUMMY' as AccountCode)).toBe('EXPENSE_DUMMY')
  expect(resolveAccount(setup, 'INCOME_DUMMY' as AccountCode)).toBe('INCOME_DUMMY')
  expect(resolveAccount(setup, 'PROFIT_DUMMY' as AccountCode)).toBe('PROFIT_DUMMY')
  expect(resolveAccount(setup, 'DIVIDEND_DUMMY' as AccountCode)).toBe('DIVIDEND_DUMMY')
})


test('Account resolver mixed shortening', async () => {
  const setup = {
    accountGrouping: {
      singleFeeAccount: false,
      singleTaxAccount: true,
      singleLossAccount: false,
      singleStockAccount: true,
      singleCryptoAccount: false,
      singleExpenseAccount: true,
      singleIncomeAccount: false,
      singleProfitAccount: true,
      singleDividendAccount: false
    }
  }

  expect(resolveAccount(setup, 'FEE_DUMMY' as AccountCode)).toBe('FEE_DUMMY')
  expect(resolveAccount(setup, 'TAX_DUMMY' as AccountCode)).toBe('TAX')
  expect(resolveAccount(setup, 'LOSS_DUMMY' as AccountCode)).toBe('LOSS_DUMMY')
  expect(resolveAccount(setup, 'STOCK_DUMMY' as AccountCode)).toBe('STOCK')
  expect(resolveAccount(setup, 'CRYPTO_DUMMY' as AccountCode)).toBe('CRYPTO_DUMMY')
  expect(resolveAccount(setup, 'EXPENSE_DUMMY' as AccountCode)).toBe('EXPENSE')
  expect(resolveAccount(setup, 'INCOME_DUMMY' as AccountCode)).toBe('INCOME_DUMMY')
  expect(resolveAccount(setup, 'PROFIT_DUMMY' as AccountCode)).toBe('PROFIT')
  expect(resolveAccount(setup, 'DIVIDEND_DUMMY' as AccountCode)).toBe('DIVIDEND_DUMMY')
})
