import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { JsonValue } from '@prisma/client/runtime/library'
import { UnifiedItemData } from '../types/API/UnifiedItemData'
import { RunModel } from './RunModel'
import { ItemErrorModel } from './ItemErrorModel'

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
  async fail(run: RunModel, err: Error): Promise<void> {
    await ItemErrorModel.fail(run, this, err)
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
   * Delete this item.
   */
  async destroy(): Promise<void> {
    await UnifiedItemModel.delete(this.id)
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
   * Get the unified items for the run.
   * @param run
   * @returns
   */
  static async findForRun(runId: number): Promise<UnifiedItemModel[]> {
    const items = await this.findMany<prisma.UnifiedItem, UnifiedItemModel>({ runId })
    return items
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
