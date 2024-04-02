import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { FlowPlanModel } from './FlowPlanModel'

export class BatchModel extends BaseModel<prisma.Batch> {

  static table = 'batch'
  static construct = BatchModel

  get name(): string {
    return `Barhch ${this.data.number}`
  }

  static async getNext(plan: FlowPlanModel): Promise<BatchModel> {
    const latest = await this.db.findMany({ where: { flowPlanId: plan.id }, orderBy: { number: 'desc' }, take: 1 })
    if (!latest.length) {
      const newBatch = await this.db.create({
        number: 1,
        state: 'NOT_STARTED',
        retrieved: null,
        flowPlanId: plan.id,
      })
      console.log(newBatch)
      return new BatchModel(newBatch)
    }
    throw new Error('Continuing not implemented.')
  }
}
