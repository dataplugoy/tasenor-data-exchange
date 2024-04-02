import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { UserModel } from './UserModel'
import { BatchModel } from './BatchModel'

export class FlowPlanModel extends BaseModel<prisma.FlowPlan> {

  static table = 'flowPlan'
  static construct = FlowPlanModel

  get name(): string {
    return this.data.title
  }

  /**
   * Execute a simple step of running.
   */
  async run(): Promise<void> {
    const batch = await this.getNextBatch()
    const run = await batch.startRun()
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
