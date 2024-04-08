import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { BatchModel } from './BatchModel'
import { error, log } from '@tasenor/common'
import { InputSourceModel } from './InputSourceModel'
import { InputOptions } from '../types/InputOptions'
import { FlowState } from '../types/FlowState'
import { InputSource } from '../engine/source/InputSource'
import { InputItemModel } from './InputItemModel'
import { RunModel } from './RunModel'
import { JsonValue } from '@prisma/client/runtime/library'
import { RuleModel } from './RuleModel'

export class FlowPlanModel extends BaseModel<prisma.FlowPlan> {

  static table = 'flowPlan'
  static construct = FlowPlanModel

  /**
   * A table of functions how to proceed from each step.
   */
  functions: Record<prisma.BatchState, (options: InputOptions, batch: BatchModel, run: RunModel) => Promise<'OK' | 'FAIL'>> = {
    BATCH_CREATED: (options, batch, run) => this.fetchData(options, batch, run),
    DATA_FETCHED: (options, batch, run) => this.itemizeInput(options, batch, run),
    DATA_PARSED: (options, batch, run) => this.unifyItems(options, batch, run),
    ITEMS_UNIFIED: (options, batch, run) => this.notImplemented(options, batch, run),
    OUTPUT_CREATED: (options, batch, run) => this.notImplemented(options, batch, run),
    OUTPUT_DELIVERED: (options, batch, run) => this.notImplemented(options, batch, run),
  }

  get name(): string {
    return this.data.title
  }

  get lastStamp(): Date | null {
    return this.data.lastStamp
  }

  get state(): FlowState {
    return this.data.state as FlowState
  }

  /**
   * Store the current plan state to DB.
   * @param state
   */
  async saveState(state: FlowState): Promise<void> {
    await FlowPlanModel.update<prisma.FlowPlan, FlowPlanModel>(this, { state })
  }

  /**
   * Execute the next step of running the current or new batch.
   */
  async run(options: InputOptions): Promise<void> {
    const batch = await this.getNextBatch()
    const run = await batch.startRun()
    log(`${run} for ${batch} starting from state ${batch.state}.`)

    try {
      // Execute state transition.
      const result = await this.functions[batch.state](options, batch, run)
      if (result === 'FAIL') {
        throw new Error(`Execution of ${run} for state '${batch.state}' returned FAIL (should throw detailed error perhaps).`)
      }
      if (result !== 'OK') {
        throw new Error(`Execution of ${run} for state '${batch.state}' did not return OK (perhaps incomplete implementation).`)
      }

      // Mark the new state.
      const idx = Object.keys(this.functions).indexOf(batch.state)
      const nextState = Object.keys(this.functions)[idx + 1] as prisma.BatchState
      await BatchModel.update<prisma.Batch, BatchModel>(batch, { state: nextState })
      await run.success(nextState)

      // Check for completion.
      const futureState = Object.keys(this.functions)[idx + 2]
      if (futureState === undefined) {
        log(`${batch} completed.`)
        await BatchModel.update<prisma.Batch, BatchModel>(batch, { completed: new Date() })
      } else {
        log(`${run} for ${batch} success.`)
      }

    } catch (err) {

      error(`${run} failed: ${err.stack}`)
      await run.fail(err)
    }
  }

  /**
   * Helper to mark handler function as not implemented.
   */
  private async notImplemented(_options: InputOptions, batch: BatchModel, run: RunModel): Promise<never> {
    throw new Error(`Function not yet implemented for state ${batch.state}.`)
  }

  /**
   * Create and initialize driver.
   */
  private async getDriver(options: InputOptions): Promise<InputSource> {
    const source = await this.getSource()
    const driver = source.getDriver()

    await driver.initialize(this.state, options)

    return driver
  }

  /**
   * Set up the transport and fetch the data.
   * @param options
   * @param batch
   * @param run
   */
  private async fetchData(options: InputOptions, batch: BatchModel, run: RunModel): Promise<'OK' | 'FAIL'> {
    const driver = await this.getDriver(options)

    const state = await driver.autheticate()
    await this.saveState(state)
    const data = await driver.fetchData(this.lastStamp)

    if (typeof data !== 'string') {
      throw new Error(`Bad data type '${typeof data}' received from ${driver.type} driver.`)
    }
    await batch.setData(data)
    // TODO: Update lastStamp when parsing is completed.

    return 'OK'
  }

  /**
   * Take the data received and split it to the pieces presenting an single processable entity.
   * @param options
   * @param batch
   * @param run
   */
  private async itemizeInput(options: InputOptions, batch: BatchModel, run: RunModel): Promise<'OK' | 'FAIL'> {
    const driver = await this.getDriver(options)
    const items = await driver.itemizeInput(batch)

    for (const data of items) {
      const item = await InputItemModel.save({
        data: data as unknown as JsonValue,
        flowPlanId: this.id,
        batchId: batch.id,
        runId: run.id,
        processed: false,
        skipped: false,
      })
      log(`${this} created ${item} for ${batch}.`)
    }

    return 'OK'
  }

  /**
   * Go through input items and convert them to the unified format using rules.
   * @param options
   * @param batch
   * @param run
   */
  private async unifyItems(options: InputOptions, batch: BatchModel, run: RunModel): Promise<'OK' | 'FAIL'> {
    const driver = await this.getDriver(options)
    const inputs = await InputItemModel.findForBatch(batch, false)
    const rules = await RuleModel.findForFlow(this)

    let result: 'OK' | 'FAIL' = 'OK'

    for (const input of inputs) {
      try {
        console.log(input.data.data)
        const unified = await driver.unifyItem(this, input, rules)
        // TODO: How to save and update input source rules?
        // TODO: Default handler loads rules and sorts them by key. Then pass them to rule engine.
        console.log('=>', unified)
      } catch (err) {
        result = 'FAIL'
        error(`Handling of ${input} failed: ${err}`)
        await input.fail(err)
      }
    }

    return result
  }

  /**
   * Get the input data source.
   */
  async getSource(): Promise<InputSourceModel> {
    const source = await InputSourceModel.findForFlow(this)
    if (!source) {
      throw new Error(`Cannot find input source for '${this}'.`)
    }
    return source
  }

  /**
   * Create new batch if previous is complete or get the latest incomplete batch.
   */
  async getNextBatch(): Promise<BatchModel> {
    return BatchModel.getNext(this)
  }

  /**
   * Get a list of all projects the user has.
   */
  static async findForUser(userId: number, name: string): Promise<FlowPlanModel | null> {
    const plans = await this.db.findMany({ where: { title: name, project: { userId } } })
    if (plans.length > 1) {
      throw new Error(`Too many flows named as '${name}' for user ${userId}.`)
    }
    return plans.length ? new FlowPlanModel(plans[0]) : null
  }
}
