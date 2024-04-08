import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { BatchModel } from './BatchModel'

export class UnifiedItemModel extends BaseModel<prisma.UnifiedItem> {

  static table = 'unifiedItem'
  static construct = UnifiedItemModel

  /**
   * Save item to the DB.
   * @param data
   * @returns
   */
  static async save(data: Partial<prisma.UnifiedItem>): Promise<UnifiedItemModel> {
    return UnifiedItemModel.create<prisma.UnifiedItem, UnifiedItemModel>(data)
  }

  /**
   * Get the unified items for the batch.
   * @param flow
   * @returns
   */
  static async findForBatch(batch: BatchModel, processed: boolean | undefined = undefined): Promise<UnifiedItemModel[]> {
    const items = await this.findMany<prisma.UnifiedItem, UnifiedItemModel>({ batchId: batch.id, processed })
    return items
  }
}
