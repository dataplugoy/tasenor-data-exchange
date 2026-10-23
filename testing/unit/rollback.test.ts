import { describe, expect, test, vi } from 'vitest'
import prisma from '@prisma/client'
import { FlowPlanModel } from '../../backend/src/models/FlowPlanModel'
import { OutputItemModel } from '../../backend/src/models/OutputItemModel'
import { BatchModel } from '../../backend/src/models/BatchModel'
import { OutputDriver } from '../../backend/src/driver/OutputDriver'
import { RollbackException } from '../../backend/src/exceptions/RollbackException'
import { ProcountorDriver } from '../../backend/src/driver/ProcountorDriver'
import { TasenorDriver } from '../../backend/src/driver/TasenorDriver'
import { NoActionDriver } from '../../backend/src/driver/NoActionDriver'

describe('Rolling back a batch', () => {

  test('only some destinations can remove delivered transactions', () => {
    expect(ProcountorDriver.prototype.canRollback()).toBe(false)
    expect(TasenorDriver.prototype.canRollback()).toBe(true)
    expect(NoActionDriver.prototype.canRollback()).toBe(true)
  })

  test('nothing is removed if the destination cannot remove delivered transactions', async () => {
    const plan = new FlowPlanModel({ id: 1 } as prisma.FlowPlan)
    const rollbackOuput = vi.fn()
    vi.spyOn(plan, 'getOutputDriver').mockResolvedValue({ canRollback: () => false, rollbackOuput } as unknown as OutputDriver)
    const findForBatch = vi.spyOn(OutputItemModel, 'findForBatch').mockResolvedValue([{ data: { delivered: true } }] as OutputItemModel[])
    const batch = { id: 2, destroy: vi.fn() } as unknown as BatchModel

    await expect(plan.rollback(1, batch)).rejects.toThrow(RollbackException)
    expect(rollbackOuput).not.toHaveBeenCalled()
    expect(batch.destroy).not.toHaveBeenCalled()
    findForBatch.mockRestore()
  })

  test('a retry does not remove again the transactions removed before a failure', async () => {
    const plan = new FlowPlanModel({ id: 1 } as prisma.FlowPlan)
    const removed: number[] = []
    let failing = true
    const rollbackOuput = vi.fn(async (item: OutputItemModel) => {
      if (item.id === 2 && failing) {
        throw new Error('Connection lost.')
      }
      if (removed.includes(item.id)) {
        throw new Error(`Item ${item.id} is already removed.`)
      }
      removed.push(item.id)
    })
    vi.spyOn(plan, 'getOutputDriver').mockResolvedValue({ canRollback: () => true, rollbackOuput } as unknown as OutputDriver)
    const item = (id: number) => Object.assign(new OutputItemModel({ id, delivered: true } as prisma.OutputItem), {
      rolledBack: vi.fn(async function (this: OutputItemModel) { this.data.delivered = false }),
    })
    const items = [item(1), item(2)]
    const findForBatch = vi.spyOn(OutputItemModel, 'findForBatch').mockResolvedValue(items)
    const batch = { id: 2, destroy: vi.fn() } as unknown as BatchModel
    vi.spyOn(BatchModel, 'getLatest').mockResolvedValue(null)
    vi.spyOn(FlowPlanModel, 'update').mockResolvedValue(undefined as never)
    vi.spyOn(plan, 'clearOpeningState').mockResolvedValue()

    await expect(plan.rollback(1, batch)).rejects.toThrow('Connection lost.')
    failing = false
    await plan.rollback(1, batch)
    expect(removed).toStrictEqual([1, 2])
    expect(batch.destroy).toHaveBeenCalledTimes(1)
    findForBatch.mockRestore()
  })
})
