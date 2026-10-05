import { describe, expect, test } from 'vitest'
import fs from 'fs'
import path from 'path'
import { RuleVariables, RulesEngine } from '@tasenor/common'
import { MappingError, RULE_HELPERS, compileFilter, compileResult, compileTemplate } from '../../backend/src/lib/mapping'
import { MappingCondition } from '../../backend/src/types/API/MappingCondition'
import { MappingResultView } from '../../backend/src/types/API/MappingResultView'
import { parseTitoRecords, titoItems } from '../../backend/src/lib/tito'
import { getDriver } from '../../backend/src/driver'
import { InputDriver } from '../../backend/src/driver/InputDriver'
import { RuleModel } from '../../backend/src/models/RuleModel'
import { analyzeItems, unifyItems } from '../lib/unit-testing'

const variables = {
  total: -100.8,
  text: 'Korttiosto',
  'Saaja/Maksaja': "OVHcloud O'Neil \\ Ltd",
  Viesti: 'EUR 100,80 Dublin',
  Viite: '1041',
  'Tapahtuman rahamäärä': -100.8,
}

function evaluate(expr: unknown, vars: Record<string, unknown> = variables): unknown {
  const engine = new RulesEngine({ ...RULE_HELPERS, ...vars } as unknown as RuleVariables)
  return engine.eval(expr as string)
}

function matches(...conditions: MappingCondition[]): unknown {
  return evaluate(compileFilter({ conditions }))
}

describe('Mapping rule compiler', () => {

  test('conditions', () => {
    expect(matches()).toBe(true)
    expect(matches({ field: 'Saaja/Maksaja', operator: 'equals', value: "ovhcloud o'neil \\ ltd" })).toBe(true)
    expect(matches({ field: 'Saaja/Maksaja', operator: 'equals', value: 'OVHcloud' })).toBe(false)
    expect(matches({ field: 'Viesti', operator: 'contains', value: 'dublin' })).toBe(true)
    expect(matches({ field: 'Viesti', operator: 'contains', value: 'Paris' })).toBe(false)
    expect(matches({ field: 'Viite', operator: 'oneOf', value: ['1012', '1041'] })).toBe(true)
    expect(matches({ field: 'Viite', operator: 'oneOf', value: ['1012'] })).toBe(false)
    expect(matches({ field: 'Viesti', operator: 'regex', value: '^EUR (\\d+),(\\d+)' })).toBe(true)
    expect(matches({ field: 'Viesti', operator: 'regex', value: 'd.blin$' })).toBe(true)
    expect(matches({ field: 'Saaja/Maksaja', operator: 'regex', value: "o'neil \\\\ " })).toBe(true)
    expect(matches({ field: 'Viesti', operator: 'regex', value: "'; x" })).toBe(false)
    expect(matches({ field: '', operator: 'negative' })).toBe(true)
    expect(matches({ field: '', operator: 'positive' })).toBe(false)
    expect(matches({ field: '', operator: 'amountEquals', value: -100.8 })).toBe(true)
    expect(matches({ field: '', operator: 'amountEquals', value: '-100,80' })).toBe(true)
    expect(matches({ field: '', operator: 'between', value: [-50, -200] })).toBe(true)
    expect(matches({ field: '', operator: 'between', value: [0, 200] })).toBe(false)
    expect(matches({ field: 'Nonexisting', operator: 'equals', value: 'x' })).toBe(false)
    expect(matches(
      { field: 'Saaja/Maksaja', operator: 'contains', value: 'ovh' },
      { field: '', operator: 'negative' },
    )).toBe(true)
    expect(matches(
      { field: 'Saaja/Maksaja', operator: 'contains', value: 'ovh' },
      { field: '', operator: 'positive' },
    )).toBe(false)
  })

  test('trimming new lines', () => {
    const vars = { ...variables, Viesti: 'R45739590, Tunnus 2842358-2, Arvonl\nisävero palautus 161,71 euroa, kork\no 0,00 euroa', Lisätieto: 'Lasku\n123' }
    const trimmed = (...conditions: MappingCondition[]) => evaluate(compileFilter({ conditions: conditions.map(c => ({ ...c, trimNewLines: true })) }), vars)
    const untrimmed = (...conditions: MappingCondition[]) => evaluate(compileFilter({ conditions }), vars)

    expect(untrimmed({ field: 'Viesti', operator: 'contains', value: 'arvonlisävero palautus' })).toBe(false)
    expect(trimmed({ field: 'Viesti', operator: 'contains', value: 'arvonlisävero palautus' })).toBe(true)
    expect(trimmed({ field: 'Viesti', operator: 'contains', value: 'korko 0,00' })).toBe(true)
    expect(untrimmed({ field: 'Viesti', operator: 'contains', value: 'arvonlisävero' })).toBe(false)
    expect(trimmed({ field: 'Viesti', operator: 'regex', value: 'Arvonlisävero palautus [0-9,]+ euroa' })).toBe(true)
    expect(trimmed({ field: 'Viesti', operator: 'contains', value: 'veronpalautus' })).toBe(false)
    expect(trimmed({ field: 'Viesti', operator: 'contains', value: 'arvonlisävero' })).toBe(true)
    expect(trimmed({ field: 'Lisätieto', operator: 'oneOf', value: ['Lasku123'] })).toBe(true)
    // Values picked from examples may contain breaks too.
    expect(trimmed({ field: 'Viesti', operator: 'contains', value: 'Arvonl\nisävero' })).toBe(true)
    // Repeated spaces and spaces around lines are ignored.
    const spaced = { ...vars, Viesti: '  Vero   palautus \n  2025  ' }
    expect(evaluate(compileFilter({ conditions: [{ field: 'Viesti', operator: 'equals', value: 'vero palautus2025', trimNewLines: true }] }), spaced)).toBe(true)
    expect(evaluate(compileFilter({ conditions: [{ field: 'Viesti', operator: 'regex', value: '^Vero palautus2025$', trimNewLines: true }] }), spaced)).toBe(true)
    expect(trimmed({ field: 'Viesti', operator: 'contains', value: '  arvonlisävero   palautus ' })).toBe(true)
    // Non-printable characters are removed and other white space is a single space.
    const messy = { ...vars, Viesti: 'Arvon\u00ADlisä\u200Bvero\tpalautus\u0007\u00A0 161,71' }
    expect(evaluate(compileFilter({ conditions: [{ field: 'Viesti', operator: 'equals', value: 'arvonlisävero palautus 161,71', trimNewLines: true }] }), messy)).toBe(true)
    expect(evaluate(compileFilter({ conditions: [{ field: 'Viesti', operator: 'contains', value: 'arvonlisävero' }] }), messy)).toBe(false)
    expect(evaluate(compileFilter({ conditions: [{ field: 'Viesti', operator: 'equals', value: 'vero palautus 2025' }] }), spaced)).toBe(false)
    // The flag is per condition.
    expect(evaluate(compileFilter({ conditions: [
      { field: 'Viesti', operator: 'contains', value: 'arvonlisävero palautus', trimNewLines: true },
      { field: 'Lisätieto', operator: 'equals', value: 'lasku123' },
    ] }), vars)).toBe(false)
    expect(evaluate(compileFilter({ conditions: [
      { field: 'Viesti', operator: 'contains', value: 'arvonlisävero palautus', trimNewLines: true },
      { field: 'Lisätieto', operator: 'equals', value: 'lasku\n123' },
    ] }), vars)).toBe(true)
    // Amount conditions are not affected.
    expect(trimmed({ field: 'Viesti', operator: 'contains', value: 'arvonlisävero' }, { field: '', operator: 'negative' })).toBe(true)
  })

  test('invalid conditions', () => {
    expect(() => compileFilter({ conditions: [{ field: 'Viesti', operator: 'regex', value: '(' }] })).toThrow(MappingError)
    expect(() => compileFilter({ conditions: [{ field: 'Viesti', operator: 'equals', value: '' }] })).toThrow(MappingError)
    expect(() => compileFilter({ conditions: [{ field: 'Viite', operator: 'oneOf', value: [] }] })).toThrow(MappingError)
    expect(() => compileFilter({ conditions: [{ field: '', operator: 'amountEquals', value: 'abc' }] })).toThrow(MappingError)
    expect(() => compileFilter({ conditions: [{ field: '', operator: 'between', value: [1] }] })).toThrow(MappingError)
  })

  test('text templates', () => {
    expect(evaluate(compileTemplate('{Saaja/Maksaja}: {Viesti}'))).toBe("OVHcloud O'Neil \\ Ltd: EUR 100,80 Dublin")
    expect(evaluate(compileTemplate('Fixed')).toString()).toBe('Fixed')
    expect(evaluate(compileTemplate('{Viite} {Missing}!'))).toBe('1041 !')
  })

  test('actions', () => {
    const result = (view: MappingResultView, vars = variables) => evaluate(compileResult(view), vars)

    expect(result({ action: 'expense', account: 'EXPENSE_SOFTWARE', text: 'Server {Viesti}', tags: ['TR', "O'K"] })).toStrictEqual({
      type: 'expense', value: 100.8, text: 'Server EUR 100,80 Dublin', account: 'EXPENSE_SOFTWARE', tags: ['TR', "O'K"]
    })
    // Refund of an expense goes to the same account.
    expect(result({ action: 'expense', account: 'EXPENSE_SOFTWARE', text: 'Refund' }, { ...variables, total: 20 })).toStrictEqual({
      type: 'income', value: 20, text: 'Refund', account: 'EXPENSE_SOFTWARE'
    })
    expect(result({ action: 'income', account: 'ACCOUNT_3000', text: 'Sales', vat: { mode: 'rate', rate: 25.5 } }, { ...variables, total: 125.5 })).toStrictEqual({
      type: 'income', value: 125.5, text: 'Sales', account: 'ACCOUNT_3000', taxType: 'vat', taxPercentage: 25.5
    })
    expect(result({ action: 'tax', account: 'TAX_CORPORATE_TAX', text: 'Tax' })).toStrictEqual({
      type: 'expense', value: 100.8, text: 'Tax', account: 'TAX_CORPORATE_TAX'
    })
    expect(result({ action: 'transfer', service: 'Nordnet', text: 'To Nordnet' })).toStrictEqual({
      type: 'withdrawal', value: 100.8, text: 'To Nordnet', service: 'Nordnet'
    })
    expect(result({ action: 'internalTransfer', text: 'Between accounts' }, { ...variables, total: 25 })).toStrictEqual({
      type: 'income', value: 25, text: 'Between accounts', account: 'TRANSFER_INTERNAL'
    })
    expect(result({ action: 'skip' })).toStrictEqual({ type: 'skip' })
  })

  test('invalid actions', () => {
    expect(() => compileResult({ action: 'expense', account: 'software' })).toThrow(MappingError)
    expect(() => compileResult({ action: 'tax', account: 'EXPENSE_X' })).toThrow(MappingError)
    expect(() => compileResult({ action: 'transfer' })).toThrow(MappingError)
    expect(() => compileResult({ action: 'transfer', service: 'Nordnet', vat: { mode: 'rate', rate: 24 } })).toThrow(MappingError)
    expect(() => compileResult({ action: 'expense', account: 'EXPENSE_X', vat: { mode: 'rate', rate: 100 } })).toThrow(MappingError)
  })

  test('mapping rules unify TITO lines', async () => {
    const items = titoItems(parseTitoRecords(fs.readFileSync(path.join(__dirname, 'data', 'Nordea-tito.nda')).toString('latin1')))
    const rule = (name: string, conditions: MappingCondition[], action: MappingResultView) => new RuleModel({
      name,
      kind: 'MAPPING',
      filter: compileFilter({ conditions }),
      result: compileResult(action),
    } as never)
    const rules = {
      '': [
        rule('Card', [{ field: 'Saaja/Maksaja', operator: 'equals', value: 'ovhcloud' }], { action: 'expense', account: 'EXPENSE_SOFTWARE', text: '{Saaja/Maksaja} {Viesti}', vat: { mode: 'rate', rate: 25.5 } }),
        rule('Nordnet', [{ field: 'Saaja/Maksaja', operator: 'contains', value: 'NORDNET' }, { field: '', operator: 'negative' }], { action: 'transfer', service: 'Nordnet', text: 'To Nordnet' }),
        rule('Fees', [{ field: 'Seliteteksti', operator: 'equals', value: 'Palvelumaksu' }], { action: 'expense', account: 'EXPENSE_BANKING_FEE', text: 'Bank fees' }),
        rule('Rest', [], { action: 'skip' }),
      ]
    }
    const driver = getDriver('NORDEA_TITO', {}, { currency: 'EUR', language: 'en' }, {}) as InputDriver
    const unified = (await unifyItems(driver, items, rules)).map(u => u.data)
    expect(unified.map(u => [u.data.type, u.data.account || u.data.service || null, u.data.bankAccount || null])).toStrictEqual([
      ['withdrawal', 'Nordnet', 'FI001234560000'],
      ['skip', null, null],
      ['skip', null, null],
      ['expense', 'EXPENSE_SOFTWARE', 'FI001234560000'],
      ['skip', null, null],
      ['expense', 'EXPENSE_BANKING_FEE', 'FI001234560000'],
    ])
    expect(unified[3].data.text).toBe('OVHcloud EUR 100,80 Dublin')

    const models = await unifyItems(driver, [items[3], items[4]], rules)
    const txs = await analyzeItems(models, { currency: 'EUR', language: 'en' })
    expect(txs.map(tx => tx.lines.map(l => [l.account, l.amount]))).toStrictEqual([
      [['BANK_FI001234560000', '-100.8'], ['EXPENSE_SOFTWARE', '80.32'], ['TAX_VAT_FROM_PURCHASES', '20.48']],
      [['BANK_FI001234560000', '-19.65'], ['EXPENSE_BANKING_FEE', '19.65']],
    ])
  })
})
