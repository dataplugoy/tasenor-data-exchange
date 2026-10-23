import { describe, expect, test } from 'vitest'
import prisma from '@prisma/client'
import { applyRules } from '../../backend/src/lib/rules'
import { RuleModel } from '../../backend/src/models/RuleModel'

function rule(id: number, priority: number, key: string, filter: string, name: string): RuleModel {
  return new RuleModel({ id, priority, key, filter, result: { name: `'${name}'` }, name } as unknown as prisma.Rule)
}

function byKey(rules: RuleModel[]): Record<string, RuleModel[]> {
  const ret: Record<string, RuleModel[]> = {}
  for (const r of [...rules].sort((a, b) => b.data.priority - a.data.priority || a.id - b.id)) {
    const k = r.data.key || ''
    ret[k] = ret[k] || []
    ret[k].push(r)
  }
  return ret
}

describe('Order of the rules', () => {

  test('a rule without a key placed first overrides the rules of the key', () => {
    const rules = byKey([rule(1, 50, 'OSTO', 'true', 'driver'), rule(2, 60, '', 'true', 'user')])
    expect(applyRules<{ name: string }>({}, rules, 'OSTO').name).toBe('user')
  })

  test('a rule of the key placed first is used before a rule without a key', () => {
    const rules = byKey([rule(1, 60, 'OSTO', 'true', 'driver'), rule(2, 50, '', 'true', 'user')])
    expect(applyRules<{ name: string }>({}, rules, 'OSTO').name).toBe('driver')
  })

  test('rules of other keys are used only if nothing else matches', () => {
    const rules = byKey([rule(1, 90, 'MYYNTI', 'true', 'other'), rule(2, 50, '', 'false', 'user'), rule(3, 40, 'OSTO', 'true', 'own')])
    expect(applyRules<{ name: string }>({}, rules, 'OSTO').name).toBe('own')
    expect(applyRules<{ name: string }>({}, rules, 'OTTO').name).toBe('other')
  })
})
