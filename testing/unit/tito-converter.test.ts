import { describe, expect, test } from 'vitest'
import fs from 'fs'
import path from 'path'
import { parseTitoRecords, titoItems } from '../../backend/src/lib/tito'
import { BookkeeperRule, Knowledge, convert, defaultVat, filterToConditions } from '../parity/tito-converter'

const items = titoItems(parseTitoRecords(fs.readFileSync(path.join(__dirname, 'data', 'Nordea-tito.nda')).toString('latin1')))

const knowledge: Knowledge = {
  vat: [
    { from: '2013-01-01', to: '2024-08-31', percentage: { EXPENSE: 24, BANKING_FEE: 0, TICKET: 10 } },
    { from: '2024-09-01', to: null, percentage: { EXPENSE: 25.5, BANKING_FEE: 0, TICKET: 10 } },
  ],
  parents: { EXPENSE: null, ADMIN: 'EXPENSE', BANKING_FEE: 'ADMIN', SOFTWARE: 'EXPENSE', TICKET: 'EXPENSE', PLANE_TICKET: 'TICKET' },
}

const settings = {
  cashAccount: '3020',
  currency: 'EUR',
  'account.expense.statement.SOFTWARE': '7660',
  'account.expense.statement.BANKING_FEE': '9690',
  'account.investment.statement.NREQ': '4030',
  'account.transfer.external.Nordnet': { ask: { Megalo: '305120' } },
  'account.tax.statement.VAT_FROM_PURCHASES': '47902',
}

const pair = (reason: string, type: string, asset: string, extra: Record<string, unknown> = {}) => [
  { reason: `'${reason}'`, type: "'currency'", asset: 'config.currency', amount: "$('Tapahtuman rahamäärä')", ...extra },
  { reason: `'${reason}'`, type: `'${type}'`, asset, amount: "-$('Tapahtuman rahamäärä')", ...extra },
]

describe('TITO converter', () => {

  test('filters to conditions', () => {
    expect(filterToConditions("Viite == '1041'")).toStrictEqual([{ field: 'Viite', operator: 'equals', value: '1041' }])
    expect(filterToConditions("$('Saaja/Maksaja') == 'OVHcloud' and $('Tapahtuman rahamäärä') < 0")).toStrictEqual([
      { field: 'Saaja/Maksaja', operator: 'equals', value: 'OVHcloud' },
      { field: '', operator: 'negative' },
    ])
    expect(filterToConditions("has(['Mintos', 'Mintos Marketplace AS'], $('Saaja/Maksaja'))")).toStrictEqual([
      { field: 'Saaja/Maksaja', operator: 'oneOf', value: ['Mintos', 'Mintos Marketplace AS'] },
    ])
    expect(filterToConditions("($('Saaja/Maksaja') == 'A' or $('Saaja/Maksaja') == 'B') and $('Tapahtuman rahamäärä') > 0")).toStrictEqual([
      { field: 'Saaja/Maksaja', operator: 'oneOf', value: ['A', 'B'] },
      { field: '', operator: 'positive' },
    ])
    expect(filterToConditions("regex('Telia Prepaid', $('Saaja/Maksaja'))")).toStrictEqual([
      { field: 'Saaja/Maksaja', operator: 'regex', value: 'Telia Prepaid' },
    ])
    expect(filterToConditions("(Viite == '1' or $('Saaja/Maksaja') == 'X') and total > 0")).toBe(null)
    expect(filterToConditions("Viite == ''")).toBe(null)
  })

  test('default VAT follows categories and dates', () => {
    expect(defaultVat(knowledge, 'expense', 'SOFTWARE', '2023-05-01')).toBe(24)
    expect(defaultVat(knowledge, 'expense', 'SOFTWARE', '2024-09-01')).toBe(25.5)
    expect(defaultVat(knowledge, 'expense', 'PLANE_TICKET', '2024-09-01')).toBe(10)
    expect(defaultVat(knowledge, 'expense', 'BANKING_FEE', '2023-05-01')).toBe(0)
    expect(defaultVat(knowledge, 'investment', 'NREQ', '2023-05-01')).toBe(0)
    expect(defaultVat(knowledge, 'expense', 'UNKNOWN', '2023-05-01')).toBe(0)
  })

  test('rules and answers', () => {
    const rules: BookkeeperRule[] = [
      { name: 'Skip additional records', filter: "Tietuetunnus != '10'", result: [] },
      { name: 'Equity', filter: "Viite == '1041'", result: pair('investment', 'statement', "'NREQ'", { text: "'SVOP (Matti)'", tags: '["MM","Nordea"]' }) },
      { name: 'Server', filter: "$('Saaja/Maksaja') == 'OVHcloud' and $('Tapahtuman rahamäärä') < 0", result: pair('expense', 'statement', "'SOFTWARE'", { text: "'Server'", tags: "['TR', 'Nordea']" }) },
      { name: 'Fees', filter: "Seliteteksti == 'Palvelumaksu'", result: pair('expense', 'statement', "'BANKING_FEE'", { text: "'Fees ' + str(total)" }) },
      { name: 'Nordnet', filter: "$('Saaja/Maksaja') == 'NORDNET BANK AB'", questions: { fund: { name: 'Funds' } }, result: pair('transfer', 'external', "'Nordnet'", { tags: ['fund', "'Nordnet'"] }) },
    ]
    const output = convert({
      rules,
      questions: [{ name: 'Funds', chooseTag: ['MEG'] }],
      answers: {
        2301030001: { fund: 'MEG', 'account.transfer.external.Nordnet': '305120' },
        2301030002: {
          transfers: [
            { reason: 'income', type: 'account', asset: '3020', amount: 234.65 },
            { reason: 'income', type: 'account', asset: '9950', amount: -234.65, data: { text: '[TR][Nordea] Tax refund' } },
          ]
        },
        2301200006: { skip: true },
      },
      settings,
      items,
      knowledge,
    })

    expect(output.rules).toStrictEqual([
      {
        name: 'Equity',
        kind: 'MAPPING',
        filterView: { conditions: [{ field: 'Viite', operator: 'equals', value: '1041' }] },
        resultView: { action: 'expense', account: 'ACCOUNT_4030', text: 'SVOP (Matti)', tags: ['MM', 'Nordea'], vat: { mode: 'none' } },
      },
      {
        name: 'Server',
        kind: 'MAPPING',
        filterView: { conditions: [{ field: 'Saaja/Maksaja', operator: 'equals', value: 'OVHcloud' }, { field: '', operator: 'negative' }] },
        resultView: { action: 'expense', account: 'ACCOUNT_7660', text: 'Server', tags: ['TR', 'Nordea'], vat: { mode: 'rate', rate: 24 } },
      },
      {
        name: 'Fees',
        kind: 'ADVANCED',
        filter: "Seliteteksti == 'Palvelumaksu'",
        key: '',
        result: { type: "total < 0 ? 'expense' : 'income'", value: 'abs(total)', account: "'ACCOUNT_9690'", text: "'Fees ' + str(total)", tags: '[]' },
      },
    ])
    expect(output.answers).toStrictEqual({
      2301030001: { type: 'expense', value: 100, account: 'ACCOUNT_305120', text: 'e-maksu', tags: ['MEG', 'Nordnet'] },
      2301030002: { type: 'income', value: 234.65, account: 'ACCOUNT_9950', text: 'Tax refund', tags: ['TR', 'Nordea'] },
      2301200006: { type: 'skip' },
    })
    expect(output.report).toContain("Rule 'Nordnet' needs answers per transaction and is converted to one-off answers.")
  })
})
