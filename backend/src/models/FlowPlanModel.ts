import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { BatchModel } from './BatchModel'
import { error, log } from '@tasenor/common'
import { InputSourceModel } from './InputSourceModel'
import { InputOptions } from '../types/InputOptions'
import { FlowState } from '../types/FlowState'
import { Driver, Driver } from '../engine/driver/Driver'
import { InputItemModel } from './InputItemModel'
import { RunModel } from './RunModel'
import { JsonValue } from '@prisma/client/runtime/library'
import { RuleModel } from './RuleModel'
import { UnifiedItemModel } from './UnifiedItemModel'
import { Stock, StockData } from '../lib/Stock'
import { Analyzer } from '../lib/analyzer/Analyzer'
import { DateTime } from 'luxon'
import { ProjectModel } from './ProjectModel'
import { OutputItemModel } from './OutputItemModel'
import { toJSON } from '../lib/utils'
import { Transaction } from '../types/Transaction'
import { OutputDestinationModel } from './OutputDestinationModel'

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
    ITEMS_UNIFIED: (options, batch, run) => this.analyzeItems(options, batch, run),
    OUTPUT_CREATED: (options, batch, run) => this.deliverOutput(options, batch, run),
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
   * Create and initialize driver for receiving data.
   */
  private async getInputDriver(options: InputOptions): Promise<Driver> {
    const source = await this.getSource()
    const driver = source.getDriver()

    await driver.initialize(this.state, options)

    return driver
  }

  /**
   * Create and initialize driver for delivering data.
   */
  private async getOutputDriver(options: InputOptions): Promise<Driver> {
    // TODO: Rename InputOptions to RuntimeOptions.
    const destination = await this.getDestination()
    const driver = destination.getDriver()

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
    const driver = await this.getInputDriver(options)

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
    const driver = await this.getInputDriver(options)
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
    const driver = await this.getInputDriver(options)
    const inputs = await InputItemModel.findForBatch(batch, false)
    let rules = await RuleModel.findForFlowByKey(this)
    if (RuleModel.count(rules) === 0) {
      rules = await driver.initializeRules(this)
    }

    let result: 'OK' | 'FAIL' = 'OK'

    // Unification is independent of time, so they can be processed in parallel, i.e. leave errors for further runs.
    for (const input of inputs) {
      try {
        await driver.unifyItem(this, run, input, rules)
        await input.success()
      } catch (err) {
        result = 'FAIL'
        error(`Handling of ${input} failed: ${err}`)
        await input.fail(err)
      }
    }

    return result
  }

  /**
   * Go through unified items and convert them to the output items.
   * @param options
   * @param batch
   * @param run
   */
  private async analyzeItems(options: InputOptions, batch: BatchModel, run: RunModel): Promise<'OK' | 'FAIL'> {
    const unifieds = await UnifiedItemModel.findForBatch(batch)
    const project = await this.getProject()
    Analyzer.configure(project.settings)

    // Unified items must be processed in order and batch must stop if one fails.
    const stock = new Stock(batch.data.initialStock as StockData)
    const analyzer = new Analyzer(stock)
    for (const unified of unifieds) {

      // Skip processed.
      if (unified.data.processed) {
        // TODO: Handle stock changes for already processed unified items.
        //       Add change to unified item and remove from output.
        continue
      }

      // Analyze unprocessed.
      let tx: Transaction
      try {
        tx = await analyzer.analyze(DateTime.fromJSDate(unified.data.time).toUTC(), unified.input)
        analyzer.apply(tx)
      } catch (err) {
        await unified.fail(err)
        throw err
      }

      // Save success.
      await OutputItemModel.save({
        data: toJSON(tx),
        skipped: false,
        delivered: false,
        unifiedId: unified.id,
        flowPlanId: this.id,
        batchId: batch.id,
        runId: run.id,
      })

      await unified.success()
    }

    return 'OK'
  }

  /**
   * Process delivering the result to the output destination.
   * @param options
   * @param batch
   * @param run
   */
  private async deliverOutput(options: InputOptions, batch: BatchModel, run: RunModel): Promise<'OK' | 'FAIL'> {
    const output = await OutputItemModel.findForBatch(batch, false)
    const driver = await this.getOutputDriver(options)
console.log(driver)
    for (const item of output) {

    }
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
   * Get the output data destination.
   */
  async getDestination(): Promise<OutputDestinationModel> {
    const dest = await OutputDestinationModel.findForFlow(this)
    if (!dest) {
      throw new Error(`Cannot find output destination for '${this}'.`)
    }
    return dest
  }

  /**
   * Get the project instance this flow belongs to.
   * @returns
   */
  async getProject(): Promise<ProjectModel> {
    return await ProjectModel.findForFlow(this)
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
