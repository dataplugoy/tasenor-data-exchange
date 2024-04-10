import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { BatchModel } from './BatchModel'
import { UnifiedInput } from '../types/UnifiedInput'
import { JsonValue } from '@prisma/client/runtime/library'

export class UnifiedItemModel extends BaseModel<prisma.UnifiedItem> {

  static table = 'unifiedItem'
  static construct = UnifiedItemModel

  get json(): Record<string, unknown> {
    return this.data.data as Record<string, unknown>
  }

  get input(): UnifiedInput {
    return this.json as unknown as UnifiedInput
  }

  /**
   * Mark this run as a failure.
   */
  async fail(err: Error): Promise<void> {
    await UnifiedItemModel.update<prisma.InputItem, UnifiedItemModel>(this, { error: err.stack || err.message })
  }

  /**
   * Mark this nput as successfully handled.
   * @param state
   */
  async success(): Promise<void> {
    await UnifiedItemModel.update<prisma.UnifiedItem, UnifiedItemModel>(this, { processed: true })
  }

  /**
   * Update stock chane for this item.
   * @param stockChange
   */
  async setStockChange(stockChange: JsonValue): Promise<void> {
    await UnifiedItemModel.update<prisma.UnifiedItem, UnifiedItemModel>(this, { stockChange })
  }

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
    const items = await this.findMany<prisma.UnifiedItem, UnifiedItemModel>({ batchId: batch.id, processed }, [{ time: 'asc' }])
    return items
  }
}
