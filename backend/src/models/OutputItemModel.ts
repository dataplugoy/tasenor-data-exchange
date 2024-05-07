import { JsonValue } from '@prisma/client/runtime/library'
import { Transaction } from '../types/API/Transaction'
import { RemoteId } from '../types/RemoteId'
import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'

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
    this.data.error = err.stack || err.message
    await OutputItemModel.update<prisma.OutputItem, OutputItemModel>(this, { error: err.stack || err.message })
  }

  /**
   * Mark this nput as successfully handled.
   * @param state
   */
  async success(remoteId: RemoteId): Promise<void> {
    this.data.delivered = true
    this.data.remoteId = remoteId as JsonValue
    await OutputItemModel.update<prisma.OutputItem, OutputItemModel>(this, { delivered: true, remoteId: remoteId as JsonValue })
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
  static async findForBatch(batchId: number, processed: boolean | undefined = undefined): Promise<OutputItemModel[]> {
    if (processed === false) {
      return await this.findMany<prisma.OutputItem, OutputItemModel>({ batchId, delivered: false, skipped: false })
    }
    if (processed === true) {
      const items = await this.db.findMany({
        where: {
          OR: [
            { batchId, delivered: true },
            { batchId, skipped: true }
          ]
        }
      })
      return items.map(item => this.instantiate(item))
    }
    return await this.findMany<prisma.OutputItem, OutputItemModel>({ batchId })
  }

  /**
   * Get the delivered output items for a flow plan.
   * @param flowPlanId
   * @returns
   */
  static async findForFlowPlan(flowPlanId: number): Promise<OutputItemModel[]> {
    return await this.findMany<prisma.OutputItem, OutputItemModel>({ flowPlanId, delivered: true })
  }

  /**
   * Retrieve all output items.
   */
  static getAll(filter = {}, order = [{ created: 'asc' }]): Promise<OutputItemModel[]> {
    return OutputItemModel.findMany<prisma.OutputItem, OutputItemModel>(filter, order)
  }

  /**
   * Check if there is more than one output with the same hash in the same flow plan.
   * @param output
   * @returns
   */
  static async isDuplicate(output: OutputItemModel): Promise<boolean> {
    const items = await OutputItemModel.findMany<prisma.OutputItem, OutputItemModel>({ flowPlanId: output.data.flowPlanId, hash: output.data.hash })
    return items.length > 1
  }

  /**
   * Extract transactions and sort them from the models.
   * @param output
   */
  static transactions(output: OutputItemModel[]): Transaction[] {
    const txs = output.map(model => model.data.data as unknown as Transaction)
    txs.sort((a, b) => (a.time === b.time ? 0 : (a.time < b.time ? -1 : 1)))
    return txs
  }
}
