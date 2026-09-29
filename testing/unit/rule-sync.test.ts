import { beforeAll, describe, expect, test } from 'vitest'
import fs from 'fs'
import path from 'path'
import { beforeModelTesting } from '../lib/unit-testing'
import { RuleModel } from '../../backend/src/models/RuleModel'
import { BaseModel } from '../../backend/src/models/BaseModel'

// Flow plan 'Nordnet' in the test database.
const FLOW = 3
const FILE = 'NordnetDriver.json'

const driverRules = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'backend', 'src', 'driver', 'rules', FILE)).toString('utf-8'))

async function markDriverFileChanged() {
  // eslint-disable-next-line dot-notation
  await BaseModel['prismaClient'].flowPlan.update({ where: { id: FLOW }, data: { ruleSourceHash: 'changed' } })
}

describe('Rule synchronization', () => {

  beforeAll(async () => {
    await beforeModelTesting()
  })

  test('driver rules are created once', async () => {
    const rules = await RuleModel.findForFlow(FLOW, FILE)
    expect(rules.map(r => r.name)).toStrictEqual(driverRules.map(r => r.name))
    expect(rules.every(r => r.data.origin === 'DRIVER')).toBe(true)

    const again = await RuleModel.findForFlow(FLOW, FILE)
    expect(again.map(r => r.id)).toStrictEqual(rules.map(r => r.id))
  })

  test('changed driver file keeps user rules and updates driver rules', async () => {
    const rules = await RuleModel.findForFlow(FLOW, FILE)
    const [edited, outdated] = rules

    // User edited the first driver rule.
    await RuleModel.update(edited, { filter: 'false', origin: 'USER' })
    // Second driver rule is outdated compared to the file.
    await RuleModel.update(outdated, { filter: 'false' })
    // User has an own rule.
    const own = await RuleModel.save({ flowPlanId: FLOW, name: 'My rule', filter: 'true', result: { type: "'skip'" }, filterView: {}, resultView: {}, origin: 'USER' })
    // Driver has removed a rule.
    const removed = await RuleModel.save({ flowPlanId: FLOW, name: 'Removed from driver', filter: 'true', result: {}, filterView: {}, resultView: {}, origin: 'DRIVER' })

    await markDriverFileChanged()
    const synced = await RuleModel.findForFlow(FLOW, FILE)
    const byName = synced.reduce((prev, cur) => ({ ...prev, [cur.name]: cur }), {} as Record<string, RuleModel>)

    expect(byName[edited.name].data.filter).toBe('false')
    expect(byName[edited.name].data.origin).toBe('USER')
    expect(byName[outdated.name].data.filter).toBe(driverRules[1].filter)
    expect(byName['My rule'].id).toBe(own.id)
    expect(byName['Removed from driver']).toBeUndefined()
    expect(synced.find(r => r.id === removed.id)).toBeUndefined()
  })

  test('disabled rules are not used for unifying', async () => {
    const rules = await RuleModel.findForFlow(FLOW, FILE)
    await RuleModel.update(rules[0], { enabled: false })

    const byKey = await RuleModel.findForFlowByKey(FLOW, FILE)
    const used = Object.values(byKey).flat().map(r => r.id)
    expect(used).not.toContain(rules[0].id)
    expect(used.length).toBe(rules.length - 1)
  })

  test('matches are counted', async () => {
    const rules = await RuleModel.findForFlow(FLOW, FILE)
    await RuleModel.recordMatch(rules[1].id)
    await RuleModel.recordMatch(rules[1].id)
    const after = await RuleModel.findForFlow(FLOW, FILE)
    const rule = after.find(r => r.id === rules[1].id) as RuleModel
    expect(rule.data.matchCount).toBe(2)
    expect(rule.data.lastMatched).toBeInstanceOf(Date)
  })
})
