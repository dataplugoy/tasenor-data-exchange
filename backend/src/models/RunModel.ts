import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { BatchModel } from './BatchModel'
import { RunResult } from '../types/API/Run'
import { AlertException } from '../exceptions/AlertException'
import { InputItemModel } from './InputItemModel'
import { UnifiedItemModel } from './UnifiedItemModel'
import { ItemErrorModel } from './ItemErrorModel'
import { OutputItemModel } from './OutputItemModel'

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
   * Delete this and everything related.
   */
  async destroy(): Promise<void> {
    const errors = await ItemErrorModel.findForRun(this.id)
    for (const item of errors) {
      await item.destroy()
    }
    const inputs = await InputItemModel.findForRun(this.id)
    for (const item of inputs) {
      await item.destroy()
    }
    const unifieds = await UnifiedItemModel.findForRun(this.id)
    for (const item of unifieds) {
      await item.destroy()
    }
    const outputs = await OutputItemModel.findForRun(this.id)
    for (const item of outputs) {
      await item.destroy()
    }
    await RunModel.delete(this.id)
  }

  /**
   * Run interrupted by alert.
   * @param err
   */
  // eslint-disable-next-line
  async alert(err: AlertException): Promise<void> {
    this.data.result = 'WAITING'
    await RunModel.update<prisma.Run, RunModel>(this, { result: 'WAITING' })
  }

  /**
   * Update counters and results.
   * @param done
   * @param total
   * @param result
   */
  async result(done: null | number, total: number | null, skipped: number | null, result: RunResult | undefined = undefined): Promise<void> {
    if (result === undefined) {
      if (done === null || total === null || (done === 0 && skipped === 0 && total > 0)) {
        result = 'ALL_FAILED'
      } else {
        if (done === 0 && total === 0) {
          result = 'NO_PROGRESS'
        } else if (done === total) {
          result = 'ALL_SUCCESS'
        } else {
          if (skipped !== null && skipped > 0) {
            if (skipped === total) {
              result = 'ALL_SKIPPED'
            } else {
              result = 'PARTLY_SKIPPED_SUCCESS'
            }
          } else {
            result = 'PARTLY_FAIL'
          }
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
