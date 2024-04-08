import { Options, parse } from 'csv-parse'
import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { FlowPlanModel } from './FlowPlanModel'
import { RunModel } from './RunModel'

export class BatchModel extends BaseModel<prisma.Batch> {

  static table = 'batch'
  static construct = BatchModel

  get state(): prisma.BatchState {
    return this.data.state
  }

  async setData(data: string): Promise<void> {
    await BatchModel.update<prisma.Batch, BatchModel>(this, { data })
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
    const records: string[][] =  []
    const parser = parse(options)

    parser.on('readable', function(){
      let record;
      while ((record = parser.read()) !== null) {
        records.push(record);
      }
    })

    parser.on('error', function(err){
      throw new Error(`CSV Parser failed: ${err.message}`)
    })

    parser.write(this.data.data)
    parser.end()

    return records
  }

  /**
   * Either create a new batch or find the last incomplete batch.
   * @param plan Flow plan.
   * @returns
   */
  static async getNext(plan: FlowPlanModel): Promise<BatchModel> {
    const latest = await this.db.findMany({ where: { flowPlanId: plan.id }, orderBy: { number: 'desc' }, take: 1 })

    if (latest.length === 0 || latest[0].completed) {
      const newBatch = await this.db.create({
        data: {
          number: latest.length ? latest[0].number + 1 : 1,
          state: 'BATCH_CREATED',
          data: null,
          flowPlanId: plan.id,
        }
      })
      return new BatchModel(newBatch)
    }

    return new BatchModel(latest[0])
  }

  /**
   * Retrieve all batches.
   */
  static getAll(filter={}): Promise<BatchModel[]> {
    return BatchModel.findMany<prisma.Batch, BatchModel>(filter)
  }
}
