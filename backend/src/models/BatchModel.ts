import { JsonValue } from '@prisma/client/runtime/library'
import chardet from 'chardet'
import { Options } from 'csv-parse'
import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { FlowPlanModel } from './FlowPlanModel'
import { RunModel } from './RunModel'
import { Service } from '../lib/services/Service'
import { parseCsv, parseEncoding } from '../lib/utils'
import { log } from '@tasenor/common'
import { OutputItemModel } from './OutputItemModel'

export type CsvOptions = Options & {
  regexMatch?: RegExp
}

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

  async setEndState(endStock: JsonValue, endBalance: JsonValue): Promise<void> {
    // TODO: We could actually do cleanup here and remove all { value: 0, amount: 0 } entries before saving.
    this.data.endStock = endStock
    this.data.endBalance = endBalance
    await BatchModel.update<prisma.Batch, BatchModel>(this, { endStock, endBalance })
  }

  /**
   * Delete this and everything related.
   */
  async destroy(): Promise<void> {
    const runs = await RunModel.findForBatch(this.id)
    for (const run of runs) {
      await run.destroy()
    }
    await BatchModel.delete(this.id)
  }

  /**
   * Undo all transactions created by this batch.
   */
  async rollback(userId: number): Promise<void> {
    const plan = await FlowPlanModel.get(this.data.flowPlanId)
    if (!plan) {
      throw new Error(`Cannot find flow plan for ${this}.`)
    }
    const output = await OutputItemModel.findForBatch(this.data.id, true)
    for (const item of output) {
      if (item.data.delivered) {
        await plan.rollback(userId, item)
      }
    }
  }

  /**
   * Initialize running.
   */
  async startRun(): Promise<RunModel> {
    const run = await RunModel.getNew(this)
    return run
  }

  /**
   * Check if any regexp matches the data and return index numbered from 1. Null if no match.
   */
  async detectVersion(regexes: RegExp[], fullText: boolean = false): Promise<number | null> {
    if (this.data.data === null) {
      throw new Error(`Cannot parse CSV, since there is no data in ${this}.`)
    }
    if (!this.data.encoding) {
      throw new Error(`Cannot parse CSV, since there is no encoding detected in ${this}.`)
    }

    // eslint-disable-next-line
    let data = this.data.data.toString(this.data.encoding as BufferEncoding)
    if (!fullText) {
      data = data.split('\n')[0]
    }
    for (let n = 0; n < regexes.length; n++) {
      if (regexes[n].test(data)) {
        return n + 1
      }
    }

    return null
  }

  /**
   * Detect and save encoding for data.
   */
  async detectEncoding(): Promise<void> {
    if (this.data.data === null) {
      return
    }
    const encoding = chardet.detect(this.data.data)
    if (!encoding) {
      throw new Error(`Unable to detect encodin for data in ${this}.`)
    }
    this.data.encoding = parseEncoding(encoding)
    log(`Encoding for ${this} seems to be ${JSON.stringify(this.data.encoding)}.`)
    await BatchModel.update<prisma.Batch, BatchModel>(this, { encoding: this.data.encoding })
  }

  /**
   * Get the CSV presentation of the data.
   */
  async parseCsv(options: CsvOptions = {}): Promise<string[][] | Record<string, string>[] | { raw: string, record: Record<string, string>}[]> {

    if (this.data.data === null) {
      throw new Error(`Cannot parse CSV, since there is no data in ${this}.`)
    }
    if (!this.data.encoding) {
      throw new Error(`Cannot parse CSV, since there is no encoding detected in ${this}.`)
    }

    // eslint-disable-next-line
    const data = this.data.data.toString(this.data.encoding as BufferEncoding)
    if (options.regexMatch) {
      if (!options.regexMatch.test(data)) {
        // TODO: It might be good idea to transfer this error in visible manner to UI.
        //       Perhaps detect somehow automatically from batch failure?
        //       An optional extra human readable error to display on the top of batch?
        //       Actually when we have information fields for questions, maybe we send it
        //       as an alert without any further options (except re-upload).
        throw new Error(`Imported data in ${this} does not match regex ${options.regexMatch}.`)
      }
    }

    return parseCsv(data, options)
  }

  /**
   * Similar to parseCsv(), but columnwise result.
   * @param options
   */
  async parseCsvColumns(options: CsvOptions = {}): Promise<{ raw: string, record: Record<string, string>}[]> {
    return this.parseCsv({ columns: true, raw: true, ...options }) as unknown as { raw: string, record: Record<string, string>}[]
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
          initialStock: plan.data.stock,
          initialBalance: plan.data.balance,
          // Keep the original stock as long as we finish the batch.
          endStock: plan.data.stock,
          endBalance: plan.data.balance,
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
