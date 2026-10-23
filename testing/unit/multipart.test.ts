import { describe, expect, test, vi } from 'vitest'
import prisma from '@prisma/client'
import { FlowPlanModel } from '../../backend/src/models/FlowPlanModel'
import { InputItemModel } from '../../backend/src/models/InputItemModel'
import { RuleModel } from '../../backend/src/models/RuleModel'
import { AlertException } from '../../backend/src/exceptions/AlertException'
import { UnifiedItemModel } from '../../backend/src/models/UnifiedItemModel'
import { RuleQuestionModel } from '../../backend/src/models/RuleQuestionModel'
import { NoMatchingRuleError } from '../../backend/src/lib/rules'

describe('Multipart items', () => {

  test('parts are not marked processed, if the run stops for a question before combining them', async () => {
    const plan = new FlowPlanModel({ id: 1, setup: {}, lastStamp: null } as unknown as prisma.FlowPlan)
    const input = (id: number) => Object.assign(new InputItemModel({ id, data: { time: '2024-01-02T12:00:00.000Z' } } as unknown as prisma.InputItem), {
      success: vi.fn(),
    })
    const inputs = [input(1), input(2), input(3)]
    const unifyItem = vi.fn(async (_flow, _run, item: InputItemModel) => {
      if (item.id === 3) {
        throw new AlertException('QUESTION' as prisma.AlertType, '/', 1, 'Question')
      }
      return { data: { multipart: 'forex', type: 'forex' }, time: '2024-01-02T12:00:00.000Z' }
    })
    vi.spyOn(plan, 'getInputDriver').mockResolvedValue({ unifyItem, answerKey: () => '' } as never)
    const spies = [
      vi.spyOn(InputItemModel, 'findForBatch').mockResolvedValue(inputs),
      vi.spyOn(InputItemModel, 'isDuplicate').mockResolvedValue(false),
      vi.spyOn(RuleModel, 'findForFlowByKey').mockResolvedValue({}),
    ]
    const run = { result: vi.fn() }

    await expect((plan as unknown as { unifyItems: (...args: unknown[]) => Promise<unknown> }).unifyItems({}, { id: 1 }, run)).rejects.toThrow(AlertException)
    expect(inputs[0].success).not.toHaveBeenCalled()
    expect(inputs[1].success).not.toHaveBeenCalled()
    spies.forEach(spy => spy.mockRestore())
  })

  test('parts are not combined, if another part is waiting for an answer', async () => {
    const plan = new FlowPlanModel({ id: 1, setup: {}, lastStamp: null } as unknown as prisma.FlowPlan)
    const input = (id: number) => Object.assign(new InputItemModel({ id, data: { time: '2024-01-02T12:00:00.000Z' } } as unknown as prisma.InputItem), {
      success: vi.fn(),
    })
    const inputs = [input(1), input(2)]
    const unifyItem = vi.fn(async (_flow, _run, item: InputItemModel) => {
      if (item.id === 2) {
        throw new NoMatchingRuleError('No rule.')
      }
      return { data: { multipart: 'forex', type: 'forex' }, time: '2024-01-02T12:00:00.000Z' }
    })
    vi.spyOn(plan, 'getInputDriver').mockResolvedValue({ unifyItem, answerKey: () => '' } as never)
    vi.spyOn(plan, 'saveState').mockResolvedValue()
    vi.spyOn(plan, 'getProject').mockResolvedValue({ settings: { language: 'en' } } as never)
    const save = vi.spyOn(UnifiedItemModel, 'save').mockResolvedValue({} as never)
    const spies = [
      save,
      vi.spyOn(InputItemModel, 'findForBatch').mockResolvedValue(inputs),
      vi.spyOn(InputItemModel, 'isDuplicate').mockResolvedValue(false),
      vi.spyOn(RuleModel, 'findForFlowByKey').mockResolvedValue({}),
      vi.spyOn(RuleQuestionModel, 'findForFlowPlan').mockResolvedValue({}),
    ]
    const run = { result: vi.fn() }
    const batch = { id: 1, setStamp: vi.fn() }

    await expect((plan as unknown as { unifyItems: (...args: unknown[]) => Promise<unknown> }).unifyItems({ userId: 1 }, batch, run)).rejects.toThrow(AlertException)
    expect(save).not.toHaveBeenCalled()
    expect(inputs[0].success).not.toHaveBeenCalled()
    spies.forEach(spy => spy.mockRestore())
  })
})
