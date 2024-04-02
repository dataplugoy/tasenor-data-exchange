import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { UserModel } from './UserModel'
import { BatchModel } from './BatchModel'
import { error } from '@tasenor/common'
import { InputSourceModel } from './InputSourceModel'

export class FlowPlanModel extends BaseModel<prisma.FlowPlan> {

  static table = 'flowPlan'
  static construct = FlowPlanModel

  /**
   * A table of functions how to proceed from each step.
   */
  functions: Record<prisma.BatchState, (batch: BatchModel) => Promise<'OK' | 'FAIL'>> = {
    BATCH_CREATED: (batch) => this.fetchData(batch),
    DATA_FETCHED: (batch) => this.notImplemented(batch),
    DATA_PARSED: (batch) => this.notImplemented(batch),
    OUTPUT_CREATED: (batch) => this.notImplemented(batch),
    OUTPUT_DELIVERED: (batch) => this.notImplemented(batch),
  }

  get name(): string {
    return this.data.title
  }

  get lastStamp(): Date | null {
    return this.data.lastStamp
  }

  /**
   * Execute the next step of running the current or new batch.
   */
  async run(): Promise<void> {
    const batch = await this.getNextBatch()
    const run = await batch.startRun()
    try {
      // Execute state transition.
      const result = await this.functions[batch.state](batch)
      if (result === 'FAIL') {
        throw new Error(`Execution for state '${batch.state}' returned FAIL (should throw detailed error perhaps).`)
      }
      if (result !== 'OK') {
        throw new Error(`Execution for state '${batch.state}' did not return OK (perhaps incomplete implementation).`)
      }

      // Mark the new state.
      const idx = Object.keys(this.functions).indexOf(batch.state)
      const nextState = Object.keys(this.functions)[idx + 1] as prisma.BatchState
      await BatchModel.update<prisma.Batch, BatchModel>(batch, { state: nextState })
      await run.success(nextState)

      // Check for completion.
      const futureState = Object.keys(this.functions)[idx + 2]
      if (futureState === undefined) {
        await BatchModel.update<prisma.Batch, BatchModel>(batch, { completed: new Date() })
      }

    } catch(err) {

      error(`Run failed: ${err.stack}`)
      await run.fail(err)
    }
  }

  /**
   * Helper to mark handler function as not implemented.
   */
  private async notImplemented(batch: BatchModel): Promise<never> {
    throw new Error(`Function not yet implemented for state ${batch.state}.`)
  }

  /**
   * Set up the transport and fetch the data.
   */
  private async fetchData(batch: BatchModel): Promise<'OK' | 'FAIL'> {
    const source = await this.getSource()
    const driver = source.getDriver()
    const data = await driver.fetchData(this.lastStamp)

    if (typeof data !== 'string') {
      throw new Error(`Bad data type '${typeof data}' received from ${driver.type} driver.`)
    }
    await batch.setData(data)
    // TODO: Update lastStamp when parsing is completed.

    return 'OK'
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
  static async findForUser(user: UserModel, name: string): Promise<FlowPlanModel | null> {
    const plans = await this.db.findMany({ where: { title: name, project: { userId: user.id } }})
    if (plans.length > 1) {
      throw new Error(`Too many flows named as '${name} for user ${user}.`)
    }
    return plans.length ? new FlowPlanModel(plans[0]) : null
  }
}
