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

}
