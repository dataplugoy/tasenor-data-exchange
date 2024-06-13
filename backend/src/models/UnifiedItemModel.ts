import { BaseModel } from './BaseModel'
import prisma, { SkipReason } from '@prisma/client'
import { JsonValue } from '@prisma/client/runtime/library'
import { UnifiedItemData } from '../types/API/UnifiedItemData'
import { RunModel } from './RunModel'
import { ItemErrorModel } from './ItemErrorModel'
import { OutputItemModel } from './OutputItemModel'
import { UnifiedItemType } from '../types/API/UnifiedItemType'

export class UnifiedItemModel extends BaseModel<prisma.UnifiedItem> {

  static table = 'unifiedItem'
  static construct = UnifiedItemModel

  get json(): Record<string, unknown> {
    return this.data.data as Record<string, unknown>
  }

  get input(): UnifiedItemData {
    return this.json as unknown as UnifiedItemData
  }

  get type(): UnifiedItemType {
    const data = this.data.data as unknown as UnifiedItemData
    return data.type
  }

  /**
   * Figure out if this item could be considered sales because kind of earning something.
   */
  isSales(): boolean {
    console.log(this.type)
    return ['sell', 'trade', 'income', 'deposit', 'dividend'].includes(this.type)
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
   * Mark this unified item as skipped.
   * @param state
   */
  async skip(skipReason: SkipReason): Promise<void> {
    this.data.skipped = true
    this.data.skipReason = skipReason
    await UnifiedItemModel.update<prisma.UnifiedItem, UnifiedItemModel>(this, { skipped: true, skipReason })
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
   * Get the unified items for the run.
   * @param run
   * @returns
   */
  static async findForOutput(item: OutputItemModel): Promise<UnifiedItemModel> {
    const ret = await this.findById<prisma.UnifiedItem, UnifiedItemModel>(item.data.unifiedId)
    return ret
  }

  /**
   * Get the unified items for the batch.
   * @param flow
   * @returns
   */
  static async findForBatch(batchId: number, processed: boolean | undefined = undefined): Promise<UnifiedItemModel[]> {
    const items = await this.findMany<prisma.UnifiedItem, UnifiedItemModel>({ batchId, processed }, [{ time: 'asc' }, { processed: 'desc' }, { id: 'asc' }])
    return items
  }

  /**
   * Retrieve all unified items.
   */
  static getAll(filter = {}): Promise<UnifiedItemModel[]> {
    return UnifiedItemModel.findMany<prisma.UnifiedItem, UnifiedItemModel>(filter, [{ created: 'asc' }])
  }
}
