import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { ShortDate, Timestring } from '@tasenor/common'
import { JsonObject } from '@prisma/client/runtime/library'
import { SkipReason } from '../types/API/InputItem'

export class InputItemModel extends BaseModel<prisma.InputItem> {

  static table = 'inputItem'
  static construct = InputItemModel

  get json(): Record<string, unknown> {
    return this.data.data as Record<string, unknown>
  }

  get fields(): Record<string, unknown> {
    return 'fields' in this.json ? this.json.fields as Record<string, unknown> : {}
  }

  get text(): string | null {
    return 'text' in this.json ? this.json.text as string : null
  }

  get time(): Timestring | ShortDate | null {
    return 'time' in this.json ? this.json.time as Timestring | ShortDate : null
  }

  get line(): number | null {
    return 'line' in this.json ? this.json.line as number : null
  }

  get total(): number | null {
    return 'total' in this.json ? this.json.total as number : null
  }

  get original(): string | JsonObject | null {
    return 'original' in this.json ? this.json.original as string | JsonObject : null
  }

  /**
   * Mark this input handling as a failure.
   */
  async fail(err: Error): Promise<void> {
    this.data.error = err.stack || err.message
    await InputItemModel.update<prisma.InputItem, InputItemModel>(this, { error: err.stack || err.message })
  }

  /**
   * Mark this input as successfully handled.
   * @param state
   */
  async success(): Promise<void> {
    this.data.processed = true
    await InputItemModel.update<prisma.InputItem, InputItemModel>(this, { processed: true })
  }

  /**
   * Mark this input as skipped.
   * @param state
   */
  async skip(skipReason: SkipReason): Promise<void> {
    this.data.skipped = true
    this.data.skipReason = skipReason
    await InputItemModel.update<prisma.InputItem, InputItemModel>(this, { skipped: true, skipReason })
  }

  /**
   * Save item to the DB.
   * @param data
   * @returns
   */
  static async save(data: Partial<prisma.InputItem>): Promise<InputItemModel> {
    return InputItemModel.create<prisma.InputItem, InputItemModel>(data)
  }

  /**
   * Get the input items for the batch.
   * @param flow
   * @returns
   */
  static async findForBatch(batchId: number, processed: boolean | undefined = undefined): Promise<InputItemModel[]> {
    const items = await this.findMany<prisma.InputItem, InputItemModel>({ batchId, processed })
    return items
  }

  /**
   * Retrieve all input items.
   */
  static async getAll(filter = {}): Promise<InputItemModel[]> {
    return InputItemModel.findMany<prisma.InputItem, InputItemModel>(filter, [{ created: 'asc' }])
  }

  /**
   * Check if there is more than one input with the same hash in the same flow plan.
   * @param input
   * @returns
   */
  static async isDuplicate(input: InputItemModel): Promise<boolean> {
    const items = await InputItemModel.findMany<prisma.InputItem, InputItemModel>({ flowPlanId: input.data.flowPlanId, hash: input.data.hash })
    return items.length > 1
  }
}
