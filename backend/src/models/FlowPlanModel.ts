import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { BatchModel } from './BatchModel'
import { error, log } from '@tasenor/common'
import { InputSourceModel } from './InputSourceModel'
import { RuntimeOptions } from '../types/RuntimeOptions'
import { FlowState } from '../types/FlowState'
import { Driver } from '../engine/driver/Driver'
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
import { OutputDestinationModel } from './OutputDestinationModel'
import { AccountCode } from '../types/AccountCode'
import { AnalyzerConfig } from '../lib/analyzer/AnalyzerConfig'
import { Transaction } from '../types/API/Transaction'
import { Service } from '../lib/services/Service'

type StateHandler = (options: RuntimeOptions, batch: BatchModel, run: RunModel) => Promise<'OK' | 'FAIL'>

export class FlowPlanModel extends BaseModel<prisma.FlowPlan> {

  static table = 'flowPlan'
  static construct = FlowPlanModel

  /**
   * A table of functions how to proceed from each step.
   */
  functions: Record<prisma.BatchState, undefined | StateHandler> = {
    BATCH_CREATED: (options, batch, run) => this.fetchData(options, batch, run),
    DATA_FETCHED: (options, batch, run) => this.itemizeInput(options, batch, run),
    DATA_PARSED: (options, batch, run) => this.unifyItems(options, batch, run),
    ITEMS_UNIFIED: (options, batch, run) => this.analyzeItems(options, batch, run),
    OUTPUT_CREATED: (options, batch, run) => this.deliverOutput(options, batch, run),
    OUTPUT_DELIVERED: undefined,
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
  async run(options: RuntimeOptions): Promise<void> {
    const batch = await this.getNextBatch()
    const run = await batch.startRun()

    log(`${run} for ${batch} starting from state ${batch.state}.`)

    try {
      // Execute state transition.
      const fn: StateHandler = this.functions[batch.state] as StateHandler
      const result = this.functions[batch.state] && await fn(options, batch, run)
      if (result === 'FAIL') {
        error(`Execution of ${run} for state '${batch.state}' returned FAIL.`)
        return
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
        log(`${batch} completed and is now in state ${nextState}.`)
        await BatchModel.update<prisma.Batch, BatchModel>(batch, { completed: new Date() })
      } else {
        log(`${run} for ${batch} success and is now in state ${nextState}.`)
      }

    } catch (err) {

      error(`${run} failed: ${err.stack}`)
      await run.fail(err, null, null, 'ALL_FAILED')
    }
  }

  /**
   * Create and initialize driver for receiving data.
   */
  private async getInputDriver(options: RuntimeOptions): Promise<Driver> {
    const source = await this.getSource()
    const driver = source.getDriver()

    await driver.initialize(this.state, options)

    return driver
  }

  /**
   * Create and initialize driver for delivering data.
   */
  private async getOutputDriver(options: RuntimeOptions): Promise<Driver> {
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
  private async fetchData(options: RuntimeOptions, batch: BatchModel, run: RunModel): Promise<'OK' | 'FAIL'> {
    let result: 'OK' | 'FAIL' = 'OK'

    try {
      const driver = await this.getInputDriver(options)
      const state = await driver.autheticate()
      await this.saveState(state)
      const data = await driver.fetchData(this.lastStamp)

      if (typeof data !== 'string') {
        throw new Error(`Bad data type '${typeof data}' received from ${driver.type} driver.`)
      }
      await batch.setData(data)
      await run.result(1, 1, 'ALL_SUCCESS')
    } catch (err) {
      result = 'FAIL'
      error(`Fetching data failed: ${err.stack}`)
      await run.fail(err, null, null, 'ALL_FAILED')
    }

    return result
  }

  /**
   * Take the data received and split it to the pieces presenting an single processable entity.
   * @param options
   * @param batch
   * @param run
   */
  private async itemizeInput(options: RuntimeOptions, batch: BatchModel, run: RunModel): Promise<'OK' | 'FAIL'> {
    let result: 'OK' | 'FAIL' = 'OK'

    try {
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
      await run.result(items.length, items.length, 'ALL_SUCCESS')
    } catch (err) {
      result = 'FAIL'
      error(`Input parsing failed: ${err.stack}`)
      await run.fail(err, null, null, 'ALL_FAILED')
    }
    // TODO: Update lastStamp when parsing is completed (Hmm, do we need better resolution for old stuff? Hash?).

    return result
  }

  /**
   * Go through input items and convert them to the unified format using rules.
   * @param options
   * @param batch
   * @param run
   */
  private async unifyItems(options: RuntimeOptions, batch: BatchModel, run: RunModel): Promise<'OK' | 'FAIL'> {
    let result: 'OK' | 'FAIL' = 'OK'

    try {
      const driver = await this.getInputDriver(options)
      const inputs = await InputItemModel.findForBatch(batch.id, false)
      let rules = await RuleModel.findForFlowByKey(this.id)
      if (RuleModel.count(rules) === 0) {
        rules = await driver.initializeRules(this)
      }
      const total = inputs.length
      let done = 0
      // Unification is independent of time, so they can be processed in parallel, i.e. leave errors for further runs.
      for (const input of inputs) {
        try {
          await driver.unifyItem(this, run, input, rules)
          await input.success()
          done++
        } catch (err) {
          result = 'FAIL'
          error(`Handling of ${input} failed: ${err.stack}`)
          await input.fail(err)
        }
      }

      await run.result(done, total)

    } catch (err) {
      result = 'FAIL'
      error(`Unifying input failed: ${err.stack}`)
      await run.fail(err, null, null, 'ALL_FAILED')
    }

    return result
  }

  /**
   * Go through unified items and convert them to the output items.
   * @param options
   * @param batch
   * @param run
   */
  private async analyzeItems(options: RuntimeOptions, batch: BatchModel, run: RunModel): Promise<'OK' | 'FAIL'> {
    let result: 'OK' | 'FAIL' = 'OK'

    try {
      const unifieds = await UnifiedItemModel.findForBatch(batch.id)
      const total = unifieds.length
      let done = 0

      const project = await this.getProject()
      Analyzer.configure(project.settings as AnalyzerConfig)

      // Unified items must be processed in order and batch must stop if one fails.
      const stock = new Stock(batch.data.initialStock as StockData)
      const analyzer = new Analyzer(stock)
      analyzer.setServices(await batch.getServices())

      for (const unified of unifieds) {

        // Skip processed, but calculate current stock values.
        if (unified.data.processed) {
          stock.apply(unified.data.stockChange as Record<AccountCode, StockData>)
          done++
          continue
        }

        try {
          // Analyze unprocessed.
          let tx: Transaction
          try {
            tx = await analyzer.analyze(DateTime.fromJSDate(unified.data.time).toUTC(), unified.input)
            analyzer.apply(tx)
          } catch (err) {
            await unified.fail(err)
            throw err
          }

          // Update stock change.
          await unified.setStockChange(toJSON(analyzer.getStockChange(tx), true))

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
          done++
        } catch (err) {
          result = 'FAIL'
          error(`Unifying input failed: ${err.stack}`)
          await unified.fail(err)
          await run.fail(err)
        }
      }

      await run.result(done, total)

    } catch (err) {
      result = 'FAIL'
      error(`Analyzing item failed: ${err.stack}`)
      await run.fail(err, null, null, 'ALL_FAILED')
    }

    return result
  }

  /**
   * Process delivering the result to the output destination.
   * @param options
   * @param batch
   * @param run
   */
  private async deliverOutput(options: RuntimeOptions, batch: BatchModel, run: RunModel): Promise<'OK' | 'FAIL'> {
    let result: 'OK' | 'FAIL' = 'OK'

    try {
      const output = await OutputItemModel.findForBatch(batch.id, false)
      const driver = await this.getOutputDriver(options)
      const total = output.length
      let done = 0

      // We deliver output in any order.
      for (const item of output) {
        try {
          await driver.deliverOutput(item)
          await item.success()
          done++
        } catch (err) {
          await item.fail(err)
        }
      }

      await run.result(done, total)

    } catch (err) {
      result = 'FAIL'
      error(`Delivering output failed: ${err.stack}`)
      await run.fail(err, null, null, 'ALL_FAILED')
    }

    return result
  }

  /**
   * Get the input data source.
   */
  async getSource(): Promise<InputSourceModel> {
    const source = await InputSourceModel.findForFlow(this.id)
    if (!source) {
      throw new Error(`Cannot find input source for '${this}'.`)
    }
    return source
  }

  /**
   * Get the output data destination.
   */
  async getDestination(): Promise<OutputDestinationModel> {
    const dest = await OutputDestinationModel.findForFlow(this.id)
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
    const project = await ProjectModel.get(this.data.projectId)
    if (!project) {
      throw new Error(`Cannot find project for '${this}'.`)
    }
    return project
  }

  /**
   * Get the servies for the flow plan.
   * @param flowPlanId
   */
  static async getServices(flowPlanId: number): Promise<Service[]> {
    const plan = await FlowPlanModel.get(flowPlanId)
    if (!plan) {
      throw new Error(`Failed to find flow plan model ${flowPlanId}.`)
    }
    return ProjectModel.getServices(plan.data.projectId)
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

  /**
   * Get plans for the project.
   * @param projectId
   * @returns
   */
  static async findForProject(projectId: number): Promise<FlowPlanModel[]> {
    const plans = await FlowPlanModel.findMany<prisma.FlowPlan, FlowPlanModel>({ projectId })
    return plans
  }

  static async get(id: number): Promise<FlowPlanModel | null> {
    return this.findUnique<prisma.FlowPlan, FlowPlanModel>({ id })
  }
}
