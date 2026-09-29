import { beforeAll, describe, expect, test } from 'vitest'
import { beforeModelTesting } from '../lib/unit-testing'
import { FlowPlanModel } from '../../backend/src/models/FlowPlanModel'
import prisma from '@prisma/client'

// Flow plan 'TITO Testing' in the test database.
const FLOW = 9

describe('Flow plan setup', () => {

  beforeAll(async () => {
    await beforeModelTesting()
  })

  test('answers with numeric keys are merged as whole', async () => {
    const plan = await FlowPlanModel.findById<prisma.FlowPlan, FlowPlanModel>(FLOW)
    await plan.updateSetup({ settings: { tags: ['A', 'B'] } })
    await plan.updateSetup({ answers: { 2301030001: { type: 'expense', value: 1, account: 'EXPENSE_X', text: 'X' } } })
    await plan.updateSetup({ answers: { 2301030002: { type: 'skip' } } })
    await plan.updateSetup({ answers: { 2301030001: { type: 'income', value: 2, account: 'INCOME_Y' } } })
    await plan.updateSetup({ settings: { skipDeposits: false } })

    const loaded = await FlowPlanModel.findById<prisma.FlowPlan, FlowPlanModel>(FLOW)
    expect(loaded.data.setup).toStrictEqual({
      settings: { tags: ['A', 'B'], skipDeposits: false },
      answers: {
        2301030001: { type: 'income', value: 2, account: 'INCOME_Y' },
        2301030002: { type: 'skip' },
      }
    })

    await loaded.updateSetup({ answers: { 2301030001: null, 2301030002: null } } as never)
    expect(loaded.data.setup).toStrictEqual({ settings: { tags: ['A', 'B'], skipDeposits: false } })
  })
})
