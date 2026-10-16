import { describe, expect, test } from 'vitest'
import fs from 'fs'
import path from 'path'
import { RuleVariables, RulesEngine } from '@tasenor/common'
import { RULE_HELPERS, compileFilter, compileResult, compileTemplate } from '../../backend/src/lib/mapping'
import { RuleQuestionsRequired, defaultAnswers, mergeAnswers } from '../../backend/src/lib/questions'
import { MappingCondition } from '../../backend/src/types/API/MappingCondition'
import { MappingResultView } from '../../backend/src/types/API/MappingResultView'
import { UnifiedItemData } from '../../backend/src/types/API/UnifiedItemData'
import { Setup } from '../../backend/src/types/API/Setup'
import { parseTitoRecords, titoItems } from '../../backend/src/lib/tito'
import { getDriver } from '../../backend/src/driver'
import { InputDriver } from '../../backend/src/driver/InputDriver'
import { RuleModel } from '../../backend/src/models/RuleModel'
import { RuleQuestionModel } from '../../backend/src/models/RuleQuestionModel'
import { MappingError } from '../../backend/src/lib/mapping'
import { analyzeItems, unifyItems } from '../lib/unit-testing'

function evaluate(expr: string, vars: Record<string, unknown> = {}): unknown {
  return new RulesEngine({ ...RULE_HELPERS, ...vars } as unknown as RuleVariables).eval(expr)
}

describe('Rule questions', () => {

  test('placeholders are kept in text templates', () => {
    expect(evaluate(compileTemplate('Bussilippu: {?route} ({Saaja/Maksaja})'), { 'Saaja/Maksaja': 'Onnibus' })).toBe('Bussilippu: {?route} (Onnibus)')
  })

  test('merging answers', () => {
    const data = (): UnifiedItemData => ({ type: 'expense', text: 'Bussilippu: {?route}', tags: ['Nordea'], account: 'ACCOUNT_7800' } as UnifiedItemData)

    const d1 = data()
    mergeAnswers(d1, { 1: { option: 2, tags: ['TR', 'KR', 'Nordea'] }, 2: { name: 'route', text: 'TRE-HKI' } })
    expect(d1.tags).toStrictEqual(['Nordea', 'TR', 'KR'])
    expect(d1.text).toBe('Bussilippu: TRE-HKI')
    expect(d1.account).toBe('ACCOUNT_7800')

    const d2 = data()
    mergeAnswers(d2, { 3: { option: 0, account: 'EXPENSE_SOFTWARE' } })
    expect(d2.account).toBe('EXPENSE_SOFTWARE')
    // Unanswered placeholder is removed.
    expect(d2.text).toBe('Bussilippu:')

    const d3 = { type: 'expense', text: 'Ostos' } as UnifiedItemData
    mergeAnswers(d3, { 2: { name: 'gadget', text: 'Kovalevy' } })
    // Text is appended without placeholder.
    expect(d3.text).toBe('Ostos Kovalevy')
    expect(d3.tags).toBeUndefined()
  })

  test('default answers', () => {
    const setup: Setup = {
      lineAnswers: {
        a: { rule: 10, answers: { 1: { option: 0, tags: ['TR'] }, 2: { name: 'route', text: 'A' } } },
        b: { rule: 11, answers: { 1: { option: 1, tags: ['KR'] } } },
        c: { rule: 10, answers: { 2: { name: 'route', text: 'B' } } },
      }
    }
    // Latest of the same rule first, then latest of any rule.
    expect(defaultAnswers(setup, 10, [1, 2, 3])).toStrictEqual({ 1: { option: 0, tags: ['TR'] }, 2: { name: 'route', text: 'B' } })
    expect(defaultAnswers(setup, 12, [1])).toStrictEqual({ 1: { option: 1, tags: ['KR'] } })
    expect(defaultAnswers(setup, null, [2])).toStrictEqual({ 2: { name: 'route', text: 'B' } })
    expect(defaultAnswers({}, 10, [1])).toStrictEqual({})
  })

  test('account can come from a question', () => {
    expect(() => compileResult({ action: 'expense' })).toThrow(MappingError)
    const result = compileResult({ action: 'expense', ask: [3] })
    expect(result.account).toBeUndefined()
    expect(evaluate(result.type as string, { total: -5 })).toBe('expense')
  })

  test('validation of questions', () => {
    expect(() => RuleQuestionModel.fromRequest({ name: 'members', kind: 'TAGS', label: 'Members' })).toThrow(MappingError)
    expect(() => RuleQuestionModel.fromRequest({ name: 'members', kind: 'TAGS', label: 'Members', options: [{ label: 'Tommi' }] })).toThrow(MappingError)
    expect(() => RuleQuestionModel.fromRequest({ name: 'purchase', kind: 'ACCOUNT', label: 'Purchase', options: [{ label: 'Software', account: 'software' }] })).toThrow(MappingError)
    expect(() => RuleQuestionModel.fromRequest({ name: 'route', kind: 'TEXT', label: 'Route', options: [{ label: 'x' }] })).toThrow(MappingError)
    expect(RuleQuestionModel.fromRequest({ name: 'members', kind: 'TAGS', label: 'Members', options: [{ label: 'Tommi', tags: ['TR'], account: 'ACCOUNT_1' }] }).options).toStrictEqual([{ label: 'Tommi', tags: ['TR'] }])
    expect(RuleQuestionModel.fromRequest({ name: 'route', kind: 'TEXT', label: 'Route' }).options).toStrictEqual([])
  })

  test('unifying lines of a rule asking questions', async () => {
    const items = titoItems(parseTitoRecords(fs.readFileSync(path.join(__dirname, 'data', 'Nordea-tito.nda')).toString('latin1')))
    // Rules without ID, so that matches are not recorded to the database.
    const rule = (name: string, conditions: MappingCondition[], action: MappingResultView) => new RuleModel({
      name,
      kind: 'MAPPING',
      filter: compileFilter({ conditions }),
      result: compileResult(action),
      resultView: action,
    } as never)
    const rules = {
      '': [
        rule('Card', [{ field: 'Saaja/Maksaja', operator: 'equals', value: 'ovhcloud' }], { action: 'expense', text: 'Palvelin: {?gadget}', tags: ['Nordea'], vat: { mode: 'rate', rate: 25.5 }, ask: [1, 2, 3] }),
        rule('Rest', [], { action: 'skip' }),
      ]
    }
    const settings = { currency: 'EUR', language: 'en' } as const
    const card = [items[3]]

    // Without answers the questions are asked.
    const asking = getDriver('NORDEA_TITO', {}, settings, {}) as InputDriver
    await expect(unifyItems(asking, card, rules)).rejects.toThrow(RuleQuestionsRequired)
    // Other rules are not affected.
    expect((await unifyItems(asking, [items[4]], rules)).map(u => u.data.data.type)).toStrictEqual(['skip'])

    // With answers they are used.
    const setup: Setup = {
      lineAnswers: {
        2301150004: { rule: 1, answers: { 1: { option: 1, tags: ['TR'] }, 2: { name: 'gadget', text: 'VPS' }, 3: { option: 0, account: 'EXPENSE_SOFTWARE' } } }
      }
    }
    const answered = getDriver('NORDEA_TITO', {}, settings, setup) as InputDriver
    const models = await unifyItems(answered, card, rules)
    const data = models[0].data.data
    expect([data.type, data.account, data.text, data.tags]).toStrictEqual(['expense', 'EXPENSE_SOFTWARE', 'Palvelin: VPS', ['Nordea', 'TR']])
    const txs = await analyzeItems(models, settings)
    expect(txs[0].lines.map(l => [l.account, l.amount])).toStrictEqual([['BANK_FI001234560000', '-100.8'], ['EXPENSE_SOFTWARE', '80.32'], ['TAX_VAT_FROM_PURCHASES', '20.48']])

    // Answers stay even if the rule asks other questions later.
    const changed = { '': [rule('Card', [{ field: 'Saaja/Maksaja', operator: 'equals', value: 'ovhcloud' }], { action: 'expense', account: 'EXPENSE_SOFTWARE', tags: ['Nordea'], ask: [1, 4] })] }
    expect((await unifyItems(answered, card, changed))[0].data.data.tags).toStrictEqual(['Nordea', 'TR'])
  })
})
