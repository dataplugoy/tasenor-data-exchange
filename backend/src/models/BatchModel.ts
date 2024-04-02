import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { FlowPlanModel } from './FlowPlanModel'
import { RunModel } from './RunModel'
import { error } from '@tasenor/common'

export class BatchModel extends BaseModel<prisma.Batch> {

  static table = 'batch'
  static construct = BatchModel

  get name(): string {
    return `Batch ${this.data.number}`
  }

  get state(): prisma.BatchState {
    return this.data.state
  }

  /**
   * Initialize running.
   */
  async startRun(): Promise<RunModel> {
    const run = await RunModel.getNew(this)
    return run
  }

  /**
   * Either create a new batch or find the last incomplete batch.
   * @param plan Flow plan.
   * @returns
   */
  static async getNext(plan: FlowPlanModel): Promise<BatchModel> {
    const latest = await this.db.findMany({ where: { flowPlanId: plan.id }, orderBy: { number: 'desc' }, take: 1 })

    if (latest.length === 0 || latest[0].completed) {
      const newBatch = await this.db.create({
        data: {
          number: latest.length ? latest[0].number + 1 : 1,
          state: 'BATCH_CREATED',
          retrieved: null,
          flowPlanId: plan.id,
        }
      })
      return new BatchModel(newBatch)
    }

    return new BatchModel(latest[0])
  }
}
