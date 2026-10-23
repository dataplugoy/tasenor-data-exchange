import { describe, expect, test, vi } from 'vitest'
import prisma from '@prisma/client'
import { FlowPlanModel } from '../../backend/src/models/FlowPlanModel'
import { ProjectModel } from '../../backend/src/models/ProjectModel'
import { AnswersRequired } from '../../backend/src/exceptions/AnswersRequired'
import { Question } from '../../backend/src/types/API/Question'

describe('Settings asked during a run', () => {

  test('an old answer to ask every time is asked again without that option', async () => {
    const plan = new FlowPlanModel({ id: 1, projectId: 1, setup: { settings: { inputDuplicates: 'Ask', outputDuplicates: 'Never' } } } as unknown as prisma.FlowPlan)
    const project = vi.spyOn(ProjectModel, 'get').mockResolvedValue({ settings: { language: 'en' } } as never)

    expect(await plan.getSetting({ userId: 1 } as never, 'outputDuplicates', { line: 1 } as never)).toBe('Never')
    const asked = await plan.getSetting({ userId: 1 } as never, 'inputDuplicates', { line: 1 } as never).catch(err => err)
    expect(asked).toBeInstanceOf(AnswersRequired)
    const [question] = (asked as AnswersRequired).payload as unknown as Question[]
    expect(question.variable).toBe('settings.inputDuplicates')
    expect(question.args?.options).toStrictEqual(['Always', 'Never'])
    project.mockRestore()
  })
})
