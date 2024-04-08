import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { BatchModel } from './BatchModel'

export class InputItemModel extends BaseModel<prisma.InputItem> {

  static table = 'inputItem'
  static construct = InputItemModel

  /**
   * Mark this run as a failure.
   */
  async fail(err: Error): Promise<void> {
    await InputItemModel.update<prisma.InputItem, InputItemModel>(this, { error: err.stack || err.message })
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
  static async findForBatch(batch: BatchModel, processed: boolean | undefined = undefined): Promise<InputItemModel[]> {
    const items = await this.findMany<prisma.InputItem, InputItemModel>({ batchId: batch.id, processed })
    return items
  }
}
