import { Options, parse } from 'csv-parse'
import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { FlowPlanModel } from './FlowPlanModel'
import { RunModel } from './RunModel'
import { Service } from '../lib/services/Service'

export class BatchModel extends BaseModel<prisma.Batch> {

  static table = 'batch'
  static construct = BatchModel

  get state(): prisma.BatchState {
    return this.data.state
  }

  async setData(data: string | Buffer): Promise<void> {
    this.data.data = typeof data === 'string' ? Buffer.from(data) : data
    await BatchModel.update<prisma.Batch, BatchModel>(this, { data: this.data.data })
  }

  async setStamp(lastStamp: Date | null): Promise<void> {
    this.data.lastStamp = lastStamp
    await BatchModel.update<prisma.Batch, BatchModel>(this, { lastStamp })
  }

  /**
   * Initialize running.
   */
  async startRun(): Promise<RunModel> {
    const run = await RunModel.getNew(this)
    return run
  }

  /**
   * Get the CSV presentation of the data.
   */
  parseCsv(options: Options = {}): string[][] {
    const records: string[][] = []
    const parser = parse(options)

    parser.on('readable', function() {
      let record
      while ((record = parser.read()) !== null) {
        records.push(record)
      }
    })

    parser.on('error', function(err) {
      throw new Error(`CSV Parser failed: ${err.message}`)
    })

    parser.write(this.data.data)
    parser.end()

    return records
  }

  /**
   * Get the services for this batch model.
   */
  async getServices(): Promise<Service[]> {
    return FlowPlanModel.getServices(this.data.flowPlanId)
  }

  /**
   * Find the latest batch for the model.
   */
  static async getLatest(plan: FlowPlanModel): Promise<BatchModel | null> {
    const latest = await this.db.findMany({ where: { flowPlanId: plan.id }, orderBy: { number: 'desc' }, take: 1 })
    return latest.length ? new BatchModel(latest[0]) : null
  }

  /**
   * Either create a new batch or find the last incomplete batch.
   * @param plan Flow plan.
   * @returns
   */
  static async getNext(plan: FlowPlanModel): Promise<BatchModel> {
    const latest = await this.getLatest(plan)

    if (!latest || latest.data.completed) {
      const newBatch = await this.db.create({
        data: {
          number: latest ? latest.data.number + 1 : 1,
          state: 'BATCH_CREATED',
          data: null,
          initialStock: latest ? latest.data.endStock : plan.data.stock,
          endStock: latest ? latest.data.endStock : plan.data.stock,
          flowPlanId: plan.id,
        }
      })
      return new BatchModel(newBatch)
    }

    return latest
  }

  /**
   * Retrieve all batches.
   */
  static getAll(filter = {}): Promise<BatchModel[]> {
    return BatchModel.findMany<prisma.Batch, BatchModel>(filter)
  }

  static async findForFlow(flowPlanId: number): Promise<BatchModel[]> {
    return this.findMany<prisma.Batch, BatchModel>({ flowPlanId }, [{ created: 'desc' }])
  }

  static async get(id: number): Promise<BatchModel | null> {
    return this.findUnique<prisma.Batch, BatchModel>({ id })
  }
}
