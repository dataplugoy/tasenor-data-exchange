import { beforeAll, expect, test } from 'vitest'
import { UserModel } from '../../backend/src/models/UserModel'
import { beforeModelTesting } from '../lib/unit-testing'
import { BatchModel } from '../../backend/src/models/BatchModel'
import { RunModel } from '../../backend/src/models/RunModel'

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

      const runs = await RunModel.getAll()
      expect(runs).toHaveLength(1)
      expect(runs[0].data.initialState).toBe('BATCH_CREATED')
      expect(runs[0].data.finalState).toBe('DATA_FETCHED')
    }
  }
})