import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { UserModel } from './UserModel'
import { BatchModel } from './BatchModel'
import { error } from '@tasenor/common'

export class FlowPlanModel extends BaseModel<prisma.FlowPlan> {

  static table = 'flowPlan'
  static construct = FlowPlanModel

  /**
   * A table of functions how to proceed from each step.
   */
  functions: Record<prisma.BatchState, () => Promise<void>> = {
    BATCH_CREATED: () => this.notImplemented(),
    DATA_FETCHED: () => this.notImplemented(),
    DATA_PARSED: () => this.notImplemented(),
    OUTPUT_CREATED: () => this.notImplemented(),
    OUTPUT_DELIVERED: () => this.notImplemented(),
  }

  get name(): string {
    return this.data.title
  }

  /**
   * Execute the next step of running the current or new batch.
   */
  async run(): Promise<void> {
    const batch = await this.getNextBatch()
    const run = await batch.startRun()
    try {
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
  private async notImplemented(): Promise<never> {
    throw new Error(`Function not yet implemented.`)
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
