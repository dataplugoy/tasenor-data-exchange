import { beforeAll, expect, test } from 'vitest'
import { UserModel } from '../../backend/src/models/UserModel'
import { beforeModelTesting } from '../lib/unit-testing'
import { BatchModel } from '../../backend/src/models/BatchModel'
import { RunModel } from '../../backend/src/models/RunModel'
import { Analyzer } from '../../backend/src/lib/analyzer/Analyzer'

beforeAll(async () => beforeModelTesting())

test('Create fresh batch for a flow', async () => {

  const user = await UserModel.find('test@localhost')
  expect(user).not.toBe(null)
  if (user) {
    const plan = await user.findFlowPlan('Unit Testing')
    expect(plan).not.toBe(null)
    if (plan) {
      await plan.run({})

      const batches = await BatchModel.getAll()
      expect(batches).toHaveLength(1)
      expect(batches[0].data.number).toBe(1)
      expect(batches[0].data.state).toBe('DATA_FETCHED')

      let runs = await RunModel.getAll()
      expect(runs).toHaveLength(1)
      expect(runs[0].data.initialState).toBe('BATCH_CREATED')
      expect(runs[0].data.finalState).toBe('DATA_FETCHED')

      await plan.run({})
      runs = await RunModel.getAll()
      expect(runs).toHaveLength(2)
      expect(runs[1].data.initialState).toBe('DATA_FETCHED')
      expect(runs[1].data.finalState).toBe('DATA_PARSED')

      await plan.run({})
      runs = await RunModel.getAll()
      expect(runs).toHaveLength(3)
      expect(runs[2].data.initialState).toBe('DATA_PARSED')
      expect(runs[2].data.finalState).toBe('ITEMS_UNIFIED')

      await plan.run({})
      runs = await RunModel.getAll()
      expect(runs).toHaveLength(4)
      expect(runs[3].data.initialState).toBe('ITEMS_UNIFIED')
      expect(runs[3].data.finalState).toBe('OUTPUT_CREATED')
    }
  }
})