import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { BatchModel } from './BatchModel'
import { RunResult } from '../types/API/Run'

export class RunModel extends BaseModel<prisma.Run> {

  static table = 'run'
  static construct = RunModel

  /**
   * Mark this run as a failure.
   */
  async fail(err: Error, done: null | number | undefined = undefined, total: number | null | undefined = undefined, result: RunResult | undefined = undefined): Promise<void> {
    if (done === undefined || total === undefined || result === undefined) {
      this.data.error = err.stack || err.message
      await RunModel.update<prisma.Run, RunModel>(this, { error: err.stack || err.message })
    } else {
      this.data.error = err.stack || err.message
      this.data.done = done
      this.data.total = total
      this.data.result = result
      await RunModel.update<prisma.Run, RunModel>(this, { error: err.stack || err.message, done, total, result })
    }
  }

  /**
   * Mark this run as success.
   * @param state
   */
  async success(state: prisma.BatchState): Promise<void> {
    this.data.finalState = state
    await RunModel.update<prisma.Run, RunModel>(this, { finalState: state })
  }

  /**
   * Update counters and results.
   * @param done
   * @param total
   * @param result
   */
  async result(done: null | number, total: number | null, result: RunResult | undefined = undefined): Promise<void> {
    if (result === undefined) {
      if (done === null || total === null) {
        result = 'ALL_FAILED'
      } else {
        if (done === 0 && total === 0) {
          result = 'NO_PROGRESS'
        } else if (done === total) {
          result = 'ALL_SUCCESS'
        } else {
          result = 'PARTLY_FAIL'
        }
      }
    }
    this.data.done = done
    this.data.total = total
    this.data.result = result
    await RunModel.update<prisma.Run, RunModel>(this, { done, total, result })
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

  static async findForBatch(batchId: number): Promise<RunModel[]> {
    return this.findMany<prisma.Run, RunModel>({ batchId }, [{ created: 'desc' }])
  }
}
