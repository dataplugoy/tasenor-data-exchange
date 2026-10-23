import dot from 'dot-object'
import clone from 'clone'
import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { BatchModel } from './BatchModel'
import { Language, error, log, warning } from '@tasenor/common'
import { InputSourceModel } from './InputSourceModel'
import { RuntimeOptions } from '../types/RuntimeOptions'
import { FlowState } from '../types/FlowState'
import { InputItemModel } from './InputItemModel'
import { RunModel } from './RunModel'
import { JsonObject, JsonValue } from '@prisma/client/runtime/client'
import { RuleModel } from './RuleModel'
import { UnifiedItemModel } from './UnifiedItemModel'
import { Stock, StockDataRecord } from '../lib/Stock'
import { Analyzer } from '../lib/analyzer/Analyzer'
import { DateTime } from 'luxon'
import { ProjectModel } from './ProjectModel'
import { OutputItemModel } from './OutputItemModel'
import { toJSON } from '../lib/utils'
import { OutputDestinationModel } from './OutputDestinationModel'
import { AccountCode, isAccountNumber } from '../types/AccountCode'
import { Transaction } from '../types/API/Transaction'
import { CurrencyAnswer, Service } from '../lib/services/Service'
import { FlowPlanRunResponse } from '../types/API/flow-plans/FlowPlanRunResponse'
import { InputItemData } from '../types/API/InputItemData'
import { AlertException } from '../exceptions/AlertException'
import { RollbackException } from '../exceptions/RollbackException'
import { AlertModel } from './AlertModel'
import { UnifiedItem } from '../types/API/UnifiedItem'
import { BalanceData } from '../types/API/BalanceData'
import { Setup } from '../types/API/Setup'
import { RuleQuestion } from '../types/API/RuleQuestion'
import { Account } from '../types/API/Account'
import { AccountException } from '../exceptions/AccountException'
import { getDriver } from '../driver'
import { ProjectSettings } from '../types/API/Project'
import { Notes } from '../types/API/Notes'
import { AnswersRequired, RuleQuestionsItem, UnmatchedItem } from '../exceptions/AnswersRequired'
import { RuleQuestionsRequired, askedQuestions, defaultAnswers } from '../lib/questions'
import { RuleQuestionModel } from './RuleQuestionModel'
import { NoMatchingRuleError } from '../lib/rules'
import { InputDriver } from '../driver/InputDriver'
import { OutputDriver } from '../driver/OutputDriver'
import { QuestionExample } from '../types/API/QuestionExample'
import { StockData } from '../types/API/StockData'
import { OpeningState } from '../types/API/OpeningState'
import { RateFunction, hasOpeningValues, mergeOpeningStates, moveDebt } from '../lib/opening'
import { t } from '../lib/i18n/t'
import { Currency, Timestring } from '@tasenor/common'
import Decimal from 'decimal.js'

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

  get setup(): Setup {
    return this.data.setup as Setup
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
   * Find the last run if any.
   */
  async lastRun(): Promise<RunModel | null> {
    const batch = await BatchModel.getLatest(this)
    if (!batch) {
      return null
    }
    const runs = await RunModel.findForBatch(batch.id)
    return runs.length ? runs[0] : null
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
    await FlowPlanModel.delete(this.id)
  }

  /**
   * Use driver to remove transactions created by the output item.
   * @param item
   */
  async rollback(userId: number, batch: BatchModel): Promise<void> {
    // Ask driver to remove if delivered.
    const driver = await this.getOutputDriver({
      userId,
      flowPlanId: this.id
    })
    const output = await OutputItemModel.findForBatch(batch.id, true)
    if (output.some(item => item.data.delivered) && !driver.canRollback()) {
      throw new RollbackException('The delivered transactions cannot be removed from this bookkeeping automatically.')
    }
    for (const item of output) {
      if (item.data.delivered) {
        log(`Rolling back output item ${item} with ID ${JSON.stringify(item.data.remoteId)} by user #${userId}.`)
        await driver.rollbackOuput(item)
        await item.rolledBack()
      }
    }

    // Delete batch data.
    await batch.destroy()

    // Copy stamps and data from the previous batch.
    const latest = await BatchModel.getLatest(this)
    const lastStamp = latest ? latest.data.lastStamp : null
    const balance = latest ? latest.data.endBalance : {}
    const stock = latest ? latest.data.endStock : {}
    await FlowPlanModel.update<prisma.FlowPlan, FlowPlanModel>(this, { lastStamp, stock, balance })

    // Without batches the opening state is proposed again for the next one.
    if (!latest) {
      await this.clearOpeningState()
    }
  }

  /**
   * Forget the confirmed opening state, so that it is proposed again for the next first batch.
   */
  async clearOpeningState(): Promise<void> {
    if (this.setup.openingState) {
      const { openingState, ...setup } = this.setup
      this.data.setup = setup as JsonObject
      await FlowPlanModel.update<prisma.FlowPlan, FlowPlanModel>(this, { setup: this.data.setup })
    }
  }

  /**
   * Update the setup fields.
   * @param state
   */
  async updateSetup(patch: Partial<Setup>): Promise<void> {
    // One-off answers are keyed by input item keys, which may look like numbers. Keep them away from the dot notation
    // (numeric keys would become array indices) and replace each answer as a whole. Null removes an answer.
    // The opening state has account numbers as keys too, so it is replaced as a whole as well.
    const { answers: oldAnswers, lineAnswers: oldLineAnswers, openingState: oldOpeningState, ...oldSetup } = (this.data?.setup as Setup) || {}
    const { answers: newAnswers, lineAnswers: newLineAnswers, openingState: newOpeningState, ...setupPatch } = patch

    const setupDot = new dot('∰∰∰')
    const fullSetup = setupDot.dot(oldSetup)
    Object.assign(fullSetup, setupDot.dot(setupPatch))
    const setup: Setup = setupDot.object(fullSetup)

    const answers = { ...(oldAnswers || {}), ...(newAnswers || {}) }
    for (const key of Object.keys(answers)) {
      if (answers[key] === null) {
        delete answers[key]
      }
    }
    if (Object.keys(answers).length) {
      setup.answers = answers
    }

    // Answers to the questions of the rules are merged the same way. Changed entries go last, since the latest
    // entries give the default answers.
    const lineAnswers = { ...(oldLineAnswers || {}) }
    for (const [key, value] of Object.entries(newLineAnswers || {})) {
      delete lineAnswers[key]
      if (value !== null) {
        lineAnswers[key] = value
      }
    }
    if (Object.keys(lineAnswers).length) {
      setup.lineAnswers = lineAnswers
    }

    const openingState = newOpeningState === undefined ? oldOpeningState : newOpeningState
    if (openingState) {
      setup.openingState = openingState
    }

    this.data.setup = setup as JsonObject
    await FlowPlanModel.update<prisma.FlowPlan, FlowPlanModel>(this, { setup: this.data.setup })
  }

  /**
   * Update the stock field.
   * @param stock
   */
  async updateStock(stock: StockData): Promise<void> {
    this.data.stock = clone(stock)
    await FlowPlanModel.update<prisma.FlowPlan, FlowPlanModel>(this, { stock: this.data.stock })
  }

  /**
   * Update the balance field.
   * @param balance
   */
  async updateBalance(balance: BalanceData): Promise<void> {
    this.data.balance = clone(balance)
    await FlowPlanModel.update<prisma.FlowPlan, FlowPlanModel>(this, { balance: this.data.balance })
  }

  /**
   * Check if the variable is found from the flow plan setup. If not, throw an alert.
   * @param variable
   * @returns
   */
  async getSetting(options: RuntimeOptions, variable: string, input: InputItemData): Promise<unknown> {
    const settings = (this.data?.setup as Setup).settings || {}
    if (variable in settings && settings[variable] !== undefined) {
      return settings[variable]
    }
    const project = await ProjectModel.get(this.data.projectId)
    if (!project) {
      throw new Error('Cannot find the project.')
    }
    const example: QuestionExample = {
      line: input.line || 0,
      text: input.original
    }
    AnswersRequired.throw(`/flow-plans/${this.id}/configure`, project.settings.language as Language, options.userId, variable, example)
  }

  /**
   * Run steps until batch finished or error encountered. Create new batch if the latest done.
   * @param options
   */
  async run(options: RuntimeOptions, notes: Notes = {}, counter = 0): Promise<FlowPlanRunResponse> {
    const [batch, , result] = await this.runStep(options, notes)

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
  async getInputDriver(options: RuntimeOptions): Promise<InputDriver> {
    const source = await this.getSource()
    const project = await this.getProject()
    const driver = source.getDriver(project.settings, this.data.setup as Setup)

    await driver.initialize(this.state, options)

    return driver as InputDriver
  }

  /**
   * Get the name of the class of input driver.
   */
  async getInputDriverName(): Promise<string> {
    const driver = await this.getSource()
    return getDriver(driver.type, {}, {} as ProjectSettings, {}).constructor.name
  }

  /**
   * Create and initialize driver for delivering data.
   */
  private async getOutputDriver(options: RuntimeOptions): Promise<OutputDriver> {
    const destination = await this.getDestination()
    const project = await this.getProject()
    const driver = destination.getDriver(project.settings, this.data.setup as Setup)

    await driver.initialize(this.state, options)

    return driver as OutputDriver
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
    const firstDate = DateTime.fromJSDate(this.data.firstDate).toISO()?.substring(0, 10) as string

    try {
      const driver = await this.getInputDriver(options)
      await batch.detectEncoding()
      const items = await driver.itemizeInput(batch)

      const total = items.length
      let done = 0
      let skipped = 0

      for (const data of items) {
        // Check for first date.
        if (data.time.substring(0, 10) < firstDate) {
          warning(`Ignoring old transaction from ${data.time} since it is older than ${firstDate}.`)
          skipped++
          continue
        }

        await InputItemModel.save({
          data: data as unknown as JsonValue,
          hash: driver.inputHash(data),
          flowPlanId: this.id,
          batchId: batch.id,
          runId: run.id,
          processed: false,
          skipped: false,
        })
        done++
      }
      log(`${this} created ${items.length} input items for ${batch}.`)
      await run.result(done, total, skipped)
    } catch (err) {
      if (err instanceof AlertException) {
        throw err
      }
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

    try {
      const driver = await this.getInputDriver(options)
      const inputs = await InputItemModel.findForBatch(batch.id, false)
      const partial: Record<string, UnifiedItem[]> = {}
      const partialID: Record<string, number> = {}
      // Inputs of the parts are marked processed only after the combined item is saved. Otherwise the parts collected
      // so far would be lost, if the run stops for a question before the end.
      const partialInputs: InputItemModel[] = []

      const rules = await RuleModel.findForFlowByKey(this.id, `${driver.constructor.name}.json`)

      let total = inputs.length
      let done = 0
      let skipped = 0
      const unmatched: UnmatchedItem[] = []
      const asking: RuleQuestionsItem[] = []

      // Unification is independent of time, so they can be processed in parallel, i.e. leave errors for further runs.
      for (const input of inputs) {
        try {
          const data = input.data.data as unknown as InputItemData

          // Verify duplicates first.
          if (await InputItemModel.isDuplicate(input)) {
            const inputDuplicates = await this.getSetting(options, 'inputDuplicates', data)
            if (inputDuplicates === 'Never') {
              await input.skip('DUPLICATE')
              skipped++
              continue
            }
            // TODO: Implement asking and storing of the individual answers per item.
            if (inputDuplicates === 'Ask') {
              throw new Error('Asking about individual input item duplicate is not yet implemented.')
            }
            // Pass through since value is 'Always'.
          }

          // Verify time stamps not being in the past.
          const time = new Date(data.time)
          if (this.data.lastStamp && this.data.lastStamp >= time) {
            const allowInputFromPast = await this.getSetting(options, 'allowInputFromPast', data)
            if (allowInputFromPast === 'Never') {
              await input.skip('IN_THE_PAST')
              skipped++
              continue
            }
            // TODO: Implement asking and storing of the individual answers per item.
            if (allowInputFromPast === 'Ask') {
              throw new Error('Asking about individual input item duplicate is not yet implemented.')
            }
            // Pass through since value is 'Always'.
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
            partialInputs.push(input)
            total--
            continue
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
              ruleId: unified.ruleId ?? null,
            })
            if (unified.ruleId) {
              await RuleModel.recordMatch(unified.ruleId)
            }
            done++
          }
          await input.success()
        } catch (err) {
          if (err instanceof AlertException) {
            await run.result(done, total, skipped)
            throw err
          }
          if (err instanceof NoMatchingRuleError) {
            // Leave unprocessed and ask about all of them at the end.
            const data = input.data.data as unknown as InputItemData
            unmatched.push({ key: driver.answerKey(input), line: data.line as number, time: data.time, text: data.text, total: data.total as number, fields: data.fields })
            continue
          }
          if (err instanceof RuleQuestionsRequired) {
            // Leave unprocessed and ask the questions for all of them at the end.
            const data = input.data.data as unknown as InputItemData
            const ask = askedQuestions(err.rule.data)
            asking.push({
              key: driver.answerKey(input),
              line: data.line as number,
              time: data.time,
              text: data.text,
              total: data.total as number,
              fields: data.fields,
              ruleId: err.rule.id,
              ruleName: err.rule.name,
              ask,
              defaults: defaultAnswers(this.data.setup as Setup, err.rule.id, ask),
            })
            continue
          }
          result = 'FAIL'
          error(`Handling of ${input} failed: ${err.stack}`)
          await input.fail(run, err)
        }
      }

      // Top up with the multipart items. If some line failed or is waiting for an answer, it may be a part of them,
      // so the parts are left to be combined in the next run.
      if (result === 'OK' && !unmatched.length && !asking.length) {
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
            inputId: partialID[`${item.data.multipart}`],
            ruleId: item.ruleId ?? null,
          })
          // Count multipart lines combined to one transaction only once.
          if (item.ruleId) {
            await RuleModel.recordMatch(item.ruleId)
          }
          done++
          total++
        }
        for (const input of partialInputs) {
          await input.success()
        }
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

      if (unmatched.length || asking.length) {
        const project = await this.getProject()
        log(`${this} has ${unmatched.length} input items not matching any rule and ${asking.length} needing answers to the questions of the rules in ${batch}.`)
        const questions = await RuleQuestionModel.findForFlowPlan(this.id)
        const needed = [...new Set(asking.map(item => item.ask).flat())].filter(id => questions[id]).map(id => questions[id].data)
        AnswersRequired.forLines(`/flow-plans/${this.id}/configure`, project?.settings.language as Language, options.userId, this.id, unmatched, asking, needed as unknown as RuleQuestion[])
      }

    } catch (err) {
      if (err instanceof AlertException) {
        throw err
      }
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
      const driver = await this.getInputDriver(options)
      const total = unifieds.length
      let done = 0
      let skipped = 0

      const project = await this.getProject()

      // The first batch starts from the confirmed opening balances and assets.
      await this.checkOpeningState(options, batch, unifieds)

      // Find out the balance and stock.
      const { initialStock, endStock, initialBalance, endBalance } = batch.data
      const latestStock = Object.keys(endStock as JsonObject).length ? endStock : initialStock
      const latestBalance = Object.keys(endBalance as JsonObject).length ? endBalance : initialBalance

      // Unified items must be processed in order and batch must stop if one fails.
      const stock = new Stock(latestStock as StockDataRecord)
      const analyzer = new Analyzer(
        project.settings,
        stock,
        latestBalance as BalanceData,
        this.data.setup as Setup,
        options
      )
      analyzer.setServices(await batch.getServices())

      for (const unified of unifieds) {

        // Skip processed.
        if (unified.data.processed) {
          done++
          continue
        }

        try {
          // Analyze unprocessed.
          const tx: Transaction = await analyzer.analyze(DateTime.fromJSDate(unified.data.time).toUTC(), unified)

          // Update stock change.
          await unified.setStockChange(toJSON(analyzer.getStockChange(tx), true))

          // Skip if nothing to output.
          if (tx.lines.length === 0) {
            analyzer.apply(tx)
            await unified.skip('CONFIGURED')
            skipped++
            continue
          }

          // Verify duplicates first. A skipped duplicate is not applied, since it was counted when delivered earlier.
          const hash = driver.outputHash(tx)
          if (await OutputItemModel.hashExists(this.id, hash)) {
            const input = await InputItemModel.getData(unified.data.inputId)
            const outputDuplicates = await this.getSetting(options, 'outputDuplicates', input)
            if (outputDuplicates === 'Never') {
              await unified.skip('DUPLICATE')
              skipped++
              continue
            }
            // TODO: Implement asking and storing of the individual answers per item.
            if (outputDuplicates === 'Ask') {
              throw new Error('Asking about individual output item duplicate is not yet implemented.')
            }
            // Pass through since value is 'Always'.
          }

          analyzer.apply(tx)

          // Save the output canditate.
          await OutputItemModel.save({
            data: toJSON(tx),
            hash,
            skipped: false,
            delivered: false,
            unifiedId: unified.id,
            flowPlanId: this.id,
            batchId: batch.id,
            runId: run.id,
          })

          // Mark success and update balance & stock for batch.
          await unified.success()
          const json = analyzer.toJSON()
          await batch.setEndState(json.stock, json.balances)

          done++
        } catch (err) {
          if (err instanceof AlertException) {
            await run.result(done, total, skipped)
            throw err
          }
          result = 'FAIL'
          error(`Unifying input failed: ${err.stack}`)
          await unified.fail(run, err)
          await run.fail(err)
          return result
        }
      }

      log(`${this} analyzed and created ${done}/${total} output items for ${batch}.`)
      await run.result(done, total, skipped)

    } catch (err) {
      if (err instanceof AlertException) {
        throw err
      }
      result = 'FAIL'
      error(`Analyzing item failed: ${err.stack}`)
      await run.fail(err, null, null, 'ALL_FAILED')
    }

    return result
  }

  /**
   * Before analyzing the first batch, ask the drivers for the balances and assets before it and let the user confirm
   * them. Once confirmed, they become the starting point of the batch.
   * @param options
   * @param batch
   * @param unifieds The unified items of the batch.
   */
  private async checkOpeningState(options: RuntimeOptions, batch: BatchModel, unifieds: UnifiedItemModel[]): Promise<void> {
    if (batch.data.number !== 1 || unifieds.length === 0 || unifieds.some(unified => unified.data.processed)) {
      return
    }

    // The plan gets the balances and assets of the batch when it is completed.
    if (this.setup.openingState) {
      const { balance, stock } = this.setup.openingState
      await BatchModel.update<prisma.Batch, BatchModel>(batch, {
        initialBalance: balance,
        initialStock: stock,
        endBalance: balance,
        endStock: stock,
      })
      return
    }

    const proposal = await this.proposeOpeningState(options, batch, unifieds)
    if (proposal) {
      const project = await this.getProject()
      AnswersRequired.forOpeningState(`/flow-plans/${this.id}/configure`, project.settings.language as Language, options.userId, proposal, project.settings.currency as Currency)
    }
  }

  /**
   * Collect the opening balances and assets from the drivers able to tell them. The bookkeeping goes first, then the
   * input source. Values entered by hand go before both.
   * @returns The proposal or null if neither driver can tell.
   */
  private async proposeOpeningState(options: RuntimeOptions, batch: BatchModel, unifieds: UnifiedItemModel[]): Promise<OpeningState | null> {
    const project = await this.getProject()
    const language = project.settings.language as Language
    const firstDate = DateTime.fromJSDate(this.data.firstDate).toISO()?.substring(0, 10) as string
    const rate = this.rateFunction(await batch.getServices(), project.settings.currency as Currency)
    const failed = (source: string, err: unknown) => t(language, 'Asking {{source}} failed: {{message}}', { source, message: err instanceof Error ? err.message : `${err}` })

    let date = DateTime.fromJSDate(unifieds[0].data.time).toUTC().toISO()?.substring(0, 10) as string
    const notes: string[] = []
    let asked = false

    let inputState: OpeningState | null = null
    const input = await this.getInputDriver(options)
    if (input.canProvideOpeningState()) {
      asked = true
      try {
        inputState = await input.openingState(batch, firstDate, rate)
        if (inputState) {
          date = inputState.date
        }
      } catch (err) {
        if (err instanceof AlertException) {
          throw err
        }
        error(`Opening state from ${input.type} failed: ${err instanceof Error ? err.stack : err}`)
        notes.push(failed(input.type, err))
      }
    }

    let outputState: OpeningState | null = null
    const output = await this.getOutputDriver(options)
    if (output.canProvideOpeningState()) {
      asked = true
      try {
        outputState = await output.openingState(date)
      } catch (err) {
        if (err instanceof AlertException) {
          throw err
        }
        error(`Opening state from ${output.type} failed: ${err instanceof Error ? err.stack : err}`)
        notes.push(failed(output.type, err))
      }
    }

    if (!asked) {
      return null
    }

    const states = [outputState, inputState].filter(state => state !== null) as OpeningState[]

    // Negative cash goes to the debt account, if one is used. It is moved before merging, so that the debt from the
    // bookkeeping and the negative cash from the input are the same balance and not added together.
    const unknownDebt = new Set<Currency>()
    states.forEach(state => moveDebt(state, this.setup).forEach(currency => unknownDebt.add(currency)))
    if (unknownDebt.size) {
      const destination = await this.getDestination()
      AnswersRequired.forDebt(`/flow-plans/${this.id}/configure`, language, options.userId, destination.id, [...unknownDebt][0])
    }

    const merged = mergeOpeningStates(
      date,
      states,
      (this.data.balance || {}) as BalanceData,
      (this.data.stock || {}) as OpeningState['stock'],
      (what, kept, other, source) => t(language, '{{what}}: kept {{kept}}, but {{source}} tells {{other}}.', { what, kept, other, source })
    )
    merged.notes.unshift(...notes)

    if (!hasOpeningValues(merged) && merged.notes.length === 0) {
      return null
    }
    return merged
  }

  /**
   * Create a function asking currency rates from the services.
   * @param services
   * @param currency The currency of the project.
   */
  private rateFunction(services: Service[], currency: Currency): RateFunction {
    return async (from: Currency, date: string): Promise<Decimal | null> => {
      for (const service of services.filter(service => service.getEnabledCapabilities().includes('CURRENCY_RATES'))) {
        try {
          const answer = await service.query({ query: 'CURRENCY_RATES', time: `${date}T12:00:00.000Z` as Timestring, currency: from, valueCurrency: currency })
          if (answer) {
            return new Decimal((answer as CurrencyAnswer).value)
          }
        } catch (err) {
          warning(`Service ${service.constructor.name} failed to give rate of ${from} on ${date}: ${err instanceof Error ? err.message : err}`)
        }
      }
      return null
    }
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
      // Preliminary check for accounts.
      const output = await OutputItemModel.findForBatch(batch.id, false)
      const driver = await this.getOutputDriver(options)
      const destination = await this.getDestination()
      this.checkAccounts(driver, destination, output)

      // Start actual work.
      const state = await driver.autheticate()
      await this.saveState(state)
      const total = output.length
      let done = 0

      // We deliver output in any order.
      for (const item of output) {
        try {
          const remoteId = await driver.deliverOutput(item, await UnifiedItemModel.findForOutput(item))
          await item.success(remoteId)
          done++
        } catch (err) {
          if (err instanceof AlertException) {
            await run.result(done, total, 0)
            throw err
          }
          result = 'FAIL'
          error(`Delivering iten ${item} failed: ${err.stack}`)
          await item.fail(run, err)
          if (err instanceof AccountException) {
            unknownRemoteAccounts.add(err.code)
          }
        }
      }

      log(`${this} delivered ${done}/${total} output items for ${batch}.`)
      await run.result(done, total, 0)

    } catch (err) {
      if (err instanceof AlertException) {
        throw err
      }
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
   * Check that the setup covers the accounts needed. If not, throw alert.
   * @param driver
   * @param output
   */
  private checkAccounts(driver: OutputDriver, destination: OutputDestinationModel, output: OutputItemModel[]): void {

    if (!driver.needConfiguredAccounts()) {
      return
    }

    // Collect existing accounts.
    const accounts = new Set<AccountCode>()
    for (const item of output) {
      const lines = item.transaction.lines
      lines.map(line => line.account).forEach(acc => accounts.add(acc as AccountCode))
    }

    // Remove what we know from accounts.
    const configuredAccounts = this.setup.accounts || {}
    for (const account of accounts) {
      if (isAccountNumber(account) || (account in configuredAccounts && configuredAccounts[account] !== null && configuredAccounts[account] !== undefined)) {
        accounts.delete(account)
      }
    }

    // Remove known debt accounts.
    const debtAccounts = this.setup.settings?.debtAccounts || {}
    Object.keys(debtAccounts).forEach(currency => accounts.delete(`DEBT_CURRENCY_${currency}` as AccountCode))

    if (accounts.size > 0) {
      AnswersRequired.forAccounts(`/flow-plans/${this.id}/configure`, driver.projectSettings.language as Language, driver.options.userId, destination.id, accounts)
    }
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
      const plans = await this.db.findMany({ where: { project: { userId } }, orderBy: { title: 'asc' } })
      return plans.map(p => new FlowPlanModel(p))
    }
    const plans = await this.db.findMany({ where: { title: name, project: { userId } }, orderBy: { title: 'asc' } })
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
    const plans = await FlowPlanModel.findMany<prisma.FlowPlan, FlowPlanModel>({ projectId }, [{ title: 'asc' }])
    return plans
  }

  /**
   * Increase the version of the rules of the plan and record the time of the change.
   */
  static async rulesChanged(id: number): Promise<void> {
    await FlowPlanModel.db.update({ where: { id }, data: { rulesVersion: { increment: 1 }, rulesSaved: new Date() } })
  }

  static async get(id: number): Promise<FlowPlanModel | null> {
    return this.findUnique<prisma.FlowPlan, FlowPlanModel>({ id })
  }

  static async save(data: FlowPlanModel | Partial<prisma.FlowPlan>): Promise<FlowPlanModel> {
    if (data.id) {
      throw new Error('A function save() cannot be used to existing object.')
    }
    return FlowPlanModel.create<prisma.FlowPlan, FlowPlanModel>(data as JsonObject)
  }
}
