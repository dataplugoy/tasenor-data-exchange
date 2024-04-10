import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { BatchModel } from './BatchModel'

export class OutputItemModel extends BaseModel<prisma.OutputItem> {

  static table = 'outputItem'
  static construct = OutputItemModel

  get json(): Record<string, unknown> {
    return this.data.data as Record<string, unknown>
  }

  /**
   * Mark this run as a failure.
   */
  async fail(err: Error): Promise<void> {
    await OutputItemModel.update<prisma.OutputItem, OutputItemModel>(this, { error: err.stack || err.message })
  }

  /**
   * Mark this nput as successfully handled.
   * @param state
   */
  async success(): Promise<void> {
    await OutputItemModel.update<prisma.OutputItem, OutputItemModel>(this, { delivered: true })
  }

  /**
   * Save item to the DB.
   * @param data
   * @returns
   */
  static async save(data: Partial<prisma.OutputItem>): Promise<OutputItemModel> {
    return OutputItemModel.create<prisma.OutputItem, OutputItemModel>(data)
  }

  /**
   * Get the output items for the batch.
   * @param flow
   * @returns
   */
  static async findForBatch(batch: BatchModel, processed: boolean | undefined = undefined): Promise<OutputItemModel[]> {
    if (processed === false) {
      return await this.findMany<prisma.OutputItem, OutputItemModel>({ batchId: batch.id, delivered: false, skipped: false })
    }
    throw new Error(`Listing processed output items is not implemented.`)
  }
}
