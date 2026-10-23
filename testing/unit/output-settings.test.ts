import { beforeAll, describe, expect, test } from 'vitest'
import prisma from '@prisma/client'
import { beforeModelTesting } from '../lib/unit-testing'
import { FlowPlanModel } from '../../backend/src/models/FlowPlanModel'
import { OutputDestinationModel } from '../../backend/src/models/OutputDestinationModel'

describe('Output settings', () => {

  beforeAll(async () => {
    await beforeModelTesting()
  })

  test('changing the settings forgets the login of the old settings', async () => {
    const plan = await FlowPlanModel.get(4) as FlowPlanModel
    await plan.saveState({ token: 'token-of-the-old-user' } as never)
    const destination = await OutputDestinationModel.findForFlow(plan.id) as OutputDestinationModel

    await destination.updateSettings({ user: 'another@localhost' })

    expect(((await FlowPlanModel.get(4)) as FlowPlanModel).data.state).toStrictEqual({})
    expect((destination.data.settings as prisma.Prisma.JsonObject).user).toBe('another@localhost')
  })
})
