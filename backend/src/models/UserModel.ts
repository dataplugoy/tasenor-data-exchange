import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { ProjectModel } from './ProjectModel'
import { FlowPlanModel } from './FlowPlanModel'
import { ServiceModel } from './ServiceModel'
import { Service } from '../lib/services/Service'

export class UserModel extends BaseModel<prisma.User> {

  static table = 'user'
  static construct = UserModel

  get name(): string {
    return this.data.email
  }

  /**
   * Get a list of all projects the user has.
   */
  async getProjects(): Promise<ProjectModel[]> {
    return ProjectModel.findForUser(this.id)
  }

  /**
   * Find the named flow for this project.
   * @param name
   */
  async findFlowPlan(name: string) {
    return FlowPlanModel.findForUser(this.id, name)
  }

  /**
   * Find a user.
   * @param email
   * @returns An user instance if found or `null` otherwie.
   */
  static async find(email: string): Promise<UserModel | null> {
    return this.findUnique<prisma.User, UserModel>({ email })
  }

  /***
   * Find the configured services for the user.
   */
  static async getServices(userId: number): Promise<Service[]> {
    const models = await ServiceModel.findForUser(userId)
    return models.map(service => service.getService())
  }

  /**
   * Save user to the DB.
   * @param data
   * @returns
   */
  static async save(data: Partial<prisma.User>): Promise<UserModel> {
    if (data.id) {
      throw new Error('A function save() cannot be used to existing object.')
    }
    return UserModel.create<prisma.User, UserModel>(data)
  }
}
