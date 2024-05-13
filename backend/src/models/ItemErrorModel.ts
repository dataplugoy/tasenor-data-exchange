import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { InputItemModel } from './InputItemModel'
import { UnifiedItemModel } from './UnifiedItemModel'
import { OutputItemModel } from './OutputItemModel'
import { RunModel } from './RunModel'

export class ItemErrorModel extends BaseModel<prisma.ItemError> {

  static table = 'itemError'
  static construct = ItemErrorModel

  /**
   * Add an item specific error for a run.
   * @param run
   * @param item
   * @param err
   */
  static async fail(run: RunModel, item: InputItemModel | UnifiedItemModel | OutputItemModel, err: Error): Promise<void> {

    const data = {
      runId: run.id,
      itemId: item.id,
      error: err.stack || err.message,
    }

    await ItemErrorModel.create<prisma.ItemError, ItemErrorModel>(data)
  }

  /**
   * Find errors for a list of runs.
   * @param batchId
   * @param processed
   */
  static async findForRuns(runIds: number[]): Promise<prisma.ItemError[]> {
    return ItemErrorModel.db.findMany<prisma.ItemError, ItemErrorModel>({ where: { runId: { in: runIds }}})
  }

}
