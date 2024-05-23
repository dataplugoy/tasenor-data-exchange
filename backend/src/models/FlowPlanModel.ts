import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { BatchModel } from './BatchModel'
import { error, log } from '@tasenor/common'
import { InputSourceModel } from './InputSourceModel'
import { RuntimeOptions } from '../types/RuntimeOptions'
import { FlowState } from '../types/FlowState'
import { Driver } from '../driver/Driver'
import { InputItemModel } from './InputItemModel'
import { RunModel } from './RunModel'
import { JsonObject, JsonValue } from '@prisma/client/runtime/library'
import { RuleModel } from './RuleModel'
import { UnifiedItemModel } from './UnifiedItemModel'
import { Stock, StockDataRecord } from '../lib/Stock'
import { Analyzer } from '../lib/analyzer/Analyzer'
import { DateTime } from 'luxon'
import { ProjectModel } from './ProjectModel'
import { OutputItemModel } from './OutputItemModel'
import { toJSON } from '../lib/utils'
import { OutputDestinationModel } from './OutputDestinationModel'
import { AccountCode } from '../types/AccountCode'
import { Transaction } from '../types/API/Transaction'
import { Service } from '../lib/services/Service'
import { FlowPlanRunResponse } from '../types/API/flow-plans/FlowPlanRunResponse'
import hash from 'object-hash'
import { InputItemData } from '../types/API/InputItemData'
import { AlertException, AnswersRequired } from '../exceptions/AlertException'
import { AlertModel } from './AlertModel'
import { UnifiedItem } from '../types/API/UnifiedItem'
import { BalanceData } from '../types/API/BalanceData'
import { Setup } from '../types/API/Setup'
import { Account } from '../types/API/Account'
import { AccountException } from '../exceptions/AccountException'
import { getDriver } from '../driver'
import { ProjectSettings } from '../types/API/Project'
import { Settings } from '../types/API/Settings'
import { Notes } from '../types/API/Notes'

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

  async setEndState(stock: JsonValue, balance: JsonValue): Promise<void> {
    this.data.stock = stock
    this.data.balance = balance
    await FlowPlanModel.update<prisma.FlowPlan, FlowPlanModel>(this, { stock, balance })
  }

  /**
   * Store the current plan state to DB.
   * @param state
   */
  async saveState(state: FlowState): Promise<void> {
    this.data.state = state
    await FlowPlanModel.update<prisma.FlowPlan, FlowPlanModel>(this, { state })
  }

  /**
   * Update the latest time stamp.
   * @param lastStamp
   */
  async setStamp(lastStamp: Date | null): Promise<void> {
    this.data.lastStamp = lastStamp
    await FlowPlanModel.update<prisma.FlowPlan, FlowPlanModel>(this, { lastStamp })
  }

  /**
   * Delete this and everything related.
   */
  async destroy(): Promise<void> {
    const batches = await BatchModel.findForFlow(this.id)
    const source = await this.getSource()
    const destination = await this.getDestination()
    await source.destroy()
    await destination.destroy()
    for (const batch of batches) {
      await batch.destroy()
    }
    for (const rule of await RuleModel.findForFlow(this.id)) {
      await rule.destroy()
    }
    FlowPlanModel.delete(this.id)
  }

  /**
   * Update the setup fields.
   * @param state
   */
  async updateSetup(patch: Partial<Setup>): Promise<void> {
    Object.assign(this.data.setup as object, patch)
    await FlowPlanModel.update<prisma.FlowPlan, FlowPlanModel>(this, { setup: this.data.setup })
  }

  /**
   * Update the settings fields.
   * @param state
   */
  async updateSettings(patch: Partial<Settings>): Promise<void> {
    const settings = (this.data?.setup as Setup).settings || {}
    Object.assign(settings, patch)
    Object.assign(this.data.setup as object, { settings })
    await FlowPlanModel.update<prisma.FlowPlan, FlowPlanModel>(this, { setup: this.data.setup })
  }

  /**
   * Run steps until batch finished or error encountered. Create new batch if the latest done.
   * @param options
   */
  async run(options: RuntimeOptions, notes: Notes = {}, counter = 0): Promise<FlowPlanRunResponse> {
    const [batch,, result] = await this.runStep(options, notes)
    if (batch.data.completed || result === 'FAIL' || result === 'WAIT' || options.repeat === 1) {
      return {
        success: result === 'OK',
        count: counter + 1
      }
    }
    if (options.repeat === 'MAX') {
      return await this.run(options, {}, counter + 1)
    } else {
      return await this.run({ ...options, repeat: (options.repeat || 0) - 1 }, {}, counter + 1)
    }
  }

  /**
   * Execute the next step of running the current or new batch.
   */
  private async runStep(options: RuntimeOptions, notes: Notes): Promise<[BatchModel, RunModel, 'OK' | 'WAIT' | 'FAIL']> {
    const batch = await this.getNextBatch()
    const run = await batch.startRun()
    await run.setNotes(notes)

    log(`${run} for ${batch} starting from state ${batch.state}.`)

    try {
      // Execute state transition.
      const fn: StateHandler = this.functions[batch.state] as StateHandler
      const result = this.functions[batch.state] && await fn(options, batch, run)
      if (result === 'FAIL') {
        error(`Execution of ${run} for state '${batch.state}' returned FAIL.`)
        return [batch, run, 'FAIL']
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
        log(`${batch} completed and is now in state ${nextState} and the last time stamp ${DateTime.fromJSDate(batch.data.lastStamp as Date).toUTC().toISO()}.`)
        await BatchModel.update<prisma.Batch, BatchModel>(batch, { completed: new Date() })
        await this.setStamp(batch.data.lastStamp)
        await this.setEndState(batch.data.endStock, batch.data.endBalance)
      } else {
        log(`${run} for ${batch} success and is now in state ${nextState}.`)
      }

      return [batch, run, 'OK']

    } catch (err) {

      if (err instanceof AlertException) {
        await run.alert(err)
        if (options.interactive) {
          throw err
        }
        await AlertModel.nonInteractive(err)
        return [batch, run, 'WAIT']
      }

      error(`${run} failed: ${err.stack}`)
      await run.fail(err, null, null, 'ALL_FAILED')
      return [batch, run, 'FAIL']
    }
  }

  /**
   * Create and initialize driver for receiving data.
   */
  private async getInputDriver(options: RuntimeOptions): Promise<Driver> {
    const source = await this.getSource()
    const project = await this.getProject()
    const driver = source.getDriver(project.settings, this.data.setup as Setup)

    await driver.initialize(this.state, options)

    return driver
  }

  /**
   * Get the name of the class of input driver.
   */
  async getInputDriverName(): Promise<string> {
    const driver = await this.getSource()
    return getDriver(driver.type, {}, {} as ProjectSettings).constructor.name
  }

  /**
   * Create and initialize driver for delivering data.
   */
  private async getOutputDriver(options: RuntimeOptions): Promise<Driver> {
    const destination = await this.getDestination()
    const project = await this.getProject()
    const driver = destination.getDriver(project.settings, this.data.setup as Setup)

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
      // TODO: This last stamp used in driver is not necessarily true if we allow old data to appear (like Lynx tax fixes).
      const data = await driver.fetchData(this)

      if (typeof data !== 'string' && !(data instanceof Buffer)) {
        throw new Error(`Bad data type '${typeof data}' received from ${driver.type} driver.`)
      }
      await batch.setData(data)
      await run.result(1, 1, 0, 'ALL_SUCCESS')

    } catch (err) {
      if (err instanceof AlertException) {
        throw err
      }
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
      await batch.detectEncoding()
      const items = await driver.itemizeInput(batch)

      for (const data of items) {
        await InputItemModel.save({
          data: data as unknown as JsonValue,
          hash: hash(data, { algorithm: 'sha1' }),
          flowPlanId: this.id,
          batchId: batch.id,
          runId: run.id,
          processed: false,
          skipped: false,
        })
      }
      log(`${this} created ${items.length} input items for ${batch}.`)
      await run.result(items.length, items.length, 0, items.length > 0 ? 'ALL_SUCCESS' : 'NO_PROGRESS')
    } catch (err) {
      result = 'FAIL'
      error(`Input parsing failed: ${err.stack}`)
      await run.fail(err, null, null, 'ALL_FAILED')
    }

    return result
  }

  /**
   * Put partial parts together and append to the input list.
   * @param inputs
   * @param partial
   */
  static combineMultipart(partial: Record<string, UnifiedItem[]>): UnifiedItem[] {
    const collect: Record<string, UnifiedItem> = {}

    Object.keys(partial).forEach((id) => {
      collect[id] = partial[id][0]
      for (let i = 1; i < partial[id].length; i++) {
        if (partial[id][i].time !== collect[id].time) {
          throw new Error(`Multipart item ${JSON.stringify(partial[id][i])} has different timestamp than the other part ${JSON.stringify(collect[id])}.`)
        }
        if (partial[id][i].data.type && collect[id].data.type && partial[id][i].data.type !== collect[id].data.type) {
          throw new Error(`Multipart item ${JSON.stringify(partial[id][i])} has different type than the other part ${JSON.stringify(collect[id])}.`)
        }
        Object.assign(collect[id].data, partial[id][i].data)
      }
    })

    return Object.values(collect)
  }

  /**
   * Go through input items and convert them to the unified format using rules.
   * @param options
   * @param batch
   * @param run
   */
  private async unifyItems(options: RuntimeOptions, batch: BatchModel, run: RunModel): Promise<'OK' | 'FAIL'> {
    let result: 'OK' | 'FAIL' = 'OK'

    // TODO: Drop test code.
    throw new AnswersRequired(`/flow-plans/${this.id}/configure`, options.userId, { type: 'BOOLEAN', help: 'If this is checked, then all goes okay.', label: 'Correctiveness toggle', variable: 'allowShortSelling' })

    try {
      const driver = await this.getInputDriver(options)
      const inputs = await InputItemModel.findForBatch(batch.id, false)
      const partial: Record<string, UnifiedItem[]> = {}
      const partialID: Record<string, number> = {}

      const rules = await RuleModel.findForFlowByKey(this.id, `${driver.constructor.name}.json`)

      let total = inputs.length
      let done = 0
      let skipped = 0

      // Unification is independent of time, so they can be processed in parallel, i.e. leave errors for further runs.
      for (const input of inputs) {
        try {
          const data = input.data.data as unknown as InputItemData

          // Verify duplicates first.
          if (await InputItemModel.isDuplicate(input)) {
            // TODO: Here we possibly throw a question wether duplicates are okay.
            //       Need three configuration options: 'never', 'always', 'ask'.
            // await input.skip('DUPLICATE')
            // skipped++
            // continue
          }

          // Verify time stamps not being in the past.
          // TODO: Here we possibly throw a question wether items can appear before the last time stamp.
          //       Need three configuration options: 'never', 'always', 'ask'.
          const time = new Date(data.time)
          if (this.data.lastStamp && this.data.lastStamp >= time) {
            await input.skip('IN_THE_PAST')
            skipped++
            continue
          }

          const unified = await driver.unifyItem(this, run, input, rules)

          if (unified.data.multipart !== undefined) {
            if (!partial[unified.data.multipart]) {
              partial[unified.data.multipart] = []
            }
            partial[unified.data.multipart].push(unified)
            // Track the last input used for multipart. To reconstruct, find the same multipart
            // fields from inputs with the same runID.
            partialID[unified.data.multipart] = input.id
            total--
          } else {
            await UnifiedItemModel.save({
              data: unified.data as unknown as JsonObject,
              time: new Date(unified.time),
              processed: false,
              skipped: false,
              flowPlanId: this.id,
              batchId: batch.id,
              runId: run.id,
              inputId: input.id,
            })
            done++
          }
          await input.success()
        } catch (err) {
          result = 'FAIL'
          error(`Handling of ${input} failed: ${err.stack}`)
          await input.fail(run, err)
        }
      }

      // Top up with the multipart items.
      for (const item of FlowPlanModel.combineMultipart(partial)) {
        await UnifiedItemModel.save({
          data: item.data as unknown as JsonObject,
          time: new Date(item.time),
          stockChange: {},
          processed: false,
          skipped: false,
          flowPlanId: this.id,
          batchId: batch.id,
          runId: run.id,
          inputId: partialID[`${item.data.multipart}`]
        })
        done++
        total++
      }

      log(`${this} created ${done}/${total} (${skipped} skipped) unified items for ${batch}.`)
      await run.result(done, total, skipped)

      // Mark the last timestamp to the batch.
      let lastStamp = this.data.lastStamp
      for (const input of inputs) {
        const data = input.data.data as unknown as InputItemData
        const newStamp = new Date(data.time)
        if (lastStamp === null || newStamp > lastStamp) {
          lastStamp = newStamp
        }
      }
      log(`${batch} has not the last time stamp as ${DateTime.fromJSDate(lastStamp as Date).toUTC().toISO()}.`)
      await batch.setStamp(lastStamp)

      // Do not pass the state from the input driver to the output driver.
      await this.saveState({})

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

      // Unified items must be processed in order and batch must stop if one fails.
      const stock = new Stock(batch.data.initialStock as StockDataRecord)
      const analyzer = new Analyzer(project.settings, stock, batch.data.initialBalance as BalanceData, this.data.setup as Setup)
      analyzer.setServices(await batch.getServices())

      for (const unified of unifieds) {

        // Skip processed, but calculate current stock values.
        if (unified.data.processed) {
          stock.apply(unified.data.stockChange as Record<AccountCode, StockDataRecord>)
          done++
          continue
        }

        try {
          // Analyze unprocessed.
          const tx: Transaction = await analyzer.analyze(DateTime.fromJSDate(unified.data.time).toUTC(), unified.input)
          analyzer.apply(tx)

          // Update stock change.
          await unified.setStockChange(toJSON(analyzer.getStockChange(tx), true))

          // Save success.
          const output = await OutputItemModel.save({
            data: toJSON(tx),
            hash: hash(tx, { algorithm: 'sha1' }),
            skipped: false,
            delivered: false,
            unifiedId: unified.id,
            flowPlanId: this.id,
            batchId: batch.id,
            runId: run.id,
          })

          // Verify duplicates first.
          if (await OutputItemModel.isDuplicate(output)) {
            // TODO: Here we possibly throw a question wether duplicates are okay.
            //       Need three configuration options: 'never', 'always', 'ask'.
            //       Also delete duplicate immediately if not allowed or query returns "no duplicate".
            // await unified.skip('DUPLICATE')
            // skipped++
            // continue
          }

          await unified.success()
          done++
        } catch (err) {
          result = 'FAIL'
          error(`Unifying input failed: ${err.stack}`)
          await unified.fail(run, err)
          await run.fail(err)
          return result
        }
      }

      log(`${this} analyzed and created ${done}/${total} output items for ${batch}.`)
      await run.result(done, total, 0)
      const json = analyzer.toJSON(true)
      await batch.setEndState(json.stock, json.balances)

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

    const unknownRemoteAccounts: Set<Account> = new Set()

    try {
      const output = await OutputItemModel.findForBatch(batch.id, false)
      const driver = await this.getOutputDriver(options)
      const state = await driver.autheticate()
      await this.saveState(state)
      const total = output.length
      let done = 0

      // We deliver output in any order.
      for (const item of output) {
        try {
          const remoteId = await driver.deliverOutput(item)
          await item.success(remoteId)
          done++
        } catch (err) {
          result = 'FAIL'
          await item.fail(run, err)
          if (err instanceof AccountException) {
            unknownRemoteAccounts.add(err.code)
          }
        }
      }

      log(`${this} delivered ${done}/${total} output items for ${batch}.`)
      await run.result(done, total, 0)

    } catch (err) {
      result = 'FAIL'
      error(`Delivering output failed: ${err.stack}`)
      await run.fail(err, null, null, 'ALL_FAILED')
    }

    // Record missing accounts as null in setup for now.
    if (unknownRemoteAccounts.size) {
      const accounts: Record<Account, unknown> = (this.data.setup as Setup).accounts || {}
      unknownRemoteAccounts.forEach(code => {
        if (!(code in accounts)) {
          accounts[code] = null
        }
      })
      log(`Updating setup to denote missing accounts: ${JSON.stringify([...unknownRemoteAccounts].join(', '))}`)
      await this.updateSetup({ accounts })
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
   * Get a list of all flow plans the user has or the one with the given name.
   */
  static async findForUser(userId: number, name: string | null = null): Promise<FlowPlanModel | FlowPlanModel[] | null> {
    if (name === null) {
      const plans = await this.db.findMany({ where: { project: { userId } } })
      return plans.map(p => new FlowPlanModel(p))
    }
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

  static async save(data: FlowPlanModel | Partial<prisma.FlowPlan>): Promise<FlowPlanModel> {
    if (data.id) {
      throw new Error('A function save() cannot be used to existing object.')
    }
    return FlowPlanModel.create<prisma.FlowPlan, FlowPlanModel>(data)
  }
}
