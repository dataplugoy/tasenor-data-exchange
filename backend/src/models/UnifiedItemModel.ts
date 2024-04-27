import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { JsonValue } from '@prisma/client/runtime/library'
import { UnifiedItemData } from '../types/API/UnifiedItemData'

export class UnifiedItemModel extends BaseModel<prisma.UnifiedItem> {

  static table = 'unifiedItem'
  static construct = UnifiedItemModel

  get json(): Record<string, unknown> {
    return this.data.data as Record<string, unknown>
  }

  get input(): UnifiedItemData {
    return this.json as unknown as UnifiedItemData
  }

  /**
   * Mark this run as a failure.
   */
  async fail(err: Error): Promise<void> {
    this.data.error = err.stack || err.message
    await UnifiedItemModel.update<prisma.UnifiedItem, UnifiedItemModel>(this, { error: err.stack || err.message })
  }

  /**
   * Mark this nput as successfully handled.
   * @param state
   */
  async success(): Promise<void> {
    this.data.processed = true
    await UnifiedItemModel.update<prisma.UnifiedItem, UnifiedItemModel>(this, { processed: true })
  }

  /**
   * Update stock chane for this item.
   * @param stockChange
   */
  async setStockChange(stockChange: JsonValue): Promise<void> {
    this.data.stockChange = stockChange
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
  static async findForBatch(batchId: number, processed: boolean | undefined = undefined): Promise<UnifiedItemModel[]> {
    const items = await this.findMany<prisma.UnifiedItem, UnifiedItemModel>({ batchId, processed }, [{ time: 'asc' }])
    return items
  }

  /**
   * Retrieve all unified items.
   */
  static getAll(filter = {}): Promise<UnifiedItemModel[]> {
    return UnifiedItemModel.findMany<prisma.UnifiedItem, UnifiedItemModel>(filter, [{ created: 'asc' }])
  }
}
