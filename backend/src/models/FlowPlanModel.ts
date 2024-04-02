import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { UserModel } from './UserModel'

export class FlowPlanModel extends BaseModel<prisma.FlowPlan> {

  static table = 'flowPlan'
  static construct = FlowPlanModel

  get name(): string {
    return this.data.title
  }

  /**
   * Get a list of all projects the user has.
   */
  static async findForUser(user: UserModel, name: string): Promise<FlowPlanModel | null> {
    const plans = await this.db.findMany({ where: { title: name, project: { userId: user.id } }})
    if (plans.length > 1) {
      throw new Error(`Too many flows named as '${name} for user ${user}.`)
    }
    return plans.length ? plans[0] : null
  }
}
