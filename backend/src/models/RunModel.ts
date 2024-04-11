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

  /**
   * Mark this run as success.
   * @param state
   */
  async success(state: prisma.BatchState): Promise<void> {
    await RunModel.update<prisma.Run, RunModel>(this, { finalState: state })
  }

  /**
   * Initialize a run for a batch.
   * @param batch
   * @returns
   */
  static async getNew(batch: BatchModel): Promise<RunModel> {
    return this.create<prisma.Run, RunModel>({
      batchId: batch.id,
      initialState: batch.data.state,
      finalState: batch.data.state,
    })
  }

  /**
   * Retrieve all runs.
   */
  static getAll(filter = {}): Promise<RunModel[]> {
    return RunModel.findMany<prisma.Run, RunModel>(filter, [{ created: 'asc' }])
  }

  // TODO: Find all findForX functions and use ID only as argument.
  static async findForBatch(batchId: number): Promise<RunModel[]> {
    return this.findMany<prisma.Run, RunModel>({ batchId }, [{ created: 'desc' }])
  }
}
