import { beforeAll, expect, test } from 'vitest'
import { UserModel } from '../../backend/src/models/UserModel'
import { beforeModelTesting } from '../lib/unit-testing'
import { BatchModel } from '../../backend/src/models/BatchModel'
import { RunModel } from '../../backend/src/models/RunModel'
import { Analyzer } from '../../backend/src/lib/analyzer/Analyzer'
import { InputItemModel } from '../../backend/src/models/InputItemModel'
import { UnifiedItemModel } from '../../backend/src/models/UnifiedItemModel'
import { OutputItemModel } from '../../backend/src/models/OutputItemModel'

beforeAll(async () => beforeModelTesting())

test('Create fresh batch for a flow', async () => {

  const user = await UserModel.find('test@localhost')
  expect(user).not.toBe(null)
  if (user) {
    const plan = await user.findFlowPlan('Unit Testing')
    expect(plan).not.toBe(null)
    if (plan) {
      // Initialize batch and fetch original data.
      await plan.run({ repeat: 1 })

      const batches = await BatchModel.getAll()
      expect(batches).toHaveLength(1)
      expect(batches[0].data.number).toBe(1)
      expect(batches[0].data.state).toBe('DATA_FETCHED')

      let runs = await RunModel.getAll()
      expect(runs).toHaveLength(1)
      expect(runs[0].data.initialState).toBe('BATCH_CREATED')
      expect(runs[0].data.finalState).toBe('DATA_FETCHED')

      // Parse input items from data.
      await plan.run({ repeat: 1 })
      runs = await RunModel.getAll()
      expect(runs).toHaveLength(2)
      expect(runs[1].data.initialState).toBe('DATA_FETCHED')
      expect(runs[1].data.finalState).toBe('DATA_PARSED')
      const input = await InputItemModel.getAll()
      expect(input).toHaveLength(3)
      expect(input[0].data.error).toBeNull()
      expect(input[1].data.error).toBeNull()
      expect(input[2].data.error).toBeNull()

      // Unify items to common format.
      await plan.run({ repeat: 1 })
      runs = await RunModel.getAll()
      expect(runs).toHaveLength(3)
      expect(runs[2].data.initialState).toBe('DATA_PARSED')
      expect(runs[2].data.finalState).toBe('ITEMS_UNIFIED')
      const unified = await UnifiedItemModel.getAll()
      expect(unified).toHaveLength(3)
      expect(unified[0].data.error).toBeNull()
      expect(unified[1].data.error).toBeNull()
      expect(unified[2].data.error).toBeNull()

      // Convert unified to output items.
      await plan.run({ repeat: 1 })
      runs = await RunModel.getAll()
      expect(runs).toHaveLength(4)
      expect(runs[3].data.initialState).toBe('ITEMS_UNIFIED')
      expect(runs[3].data.finalState).toBe('OUTPUT_CREATED')
      const output = await OutputItemModel.getAll()
      expect(output).toHaveLength(3)
      expect(output[0].data.error).toBeNull()
      expect(output[1].data.error).toBeNull()
      expect(output[2].data.error).toBeNull()
    }
  }
})