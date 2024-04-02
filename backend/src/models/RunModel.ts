import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { BatchModel } from './BatchModel'

export class RunModel extends BaseModel<prisma.Run> {

  static table = 'run'
  static construct = RunModel

  /**
   * Mark this run as a failure.
   */
  async fail(err: Error): Promise<void> {
    await RunModel.update<prisma.Run, RunModel>(this, { error: err.stack || err.message })
  }

  static async getNew(batch: BatchModel): Promise<RunModel> {
    return this.create<prisma.Run, RunModel>({
      batchId: batch.id,
      initialState: batch.data.state,
      finalState: batch.data.state,
    })
  }
}
