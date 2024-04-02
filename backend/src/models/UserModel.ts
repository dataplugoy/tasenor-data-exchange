import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { ProjectModel } from './ProjectModel'

export class UserModel extends BaseModel<prisma.User> {

  static table = 'user'
  static construct = UserModel

  /**
   * Get a list of all projects the user has.
   */
  getProjects(): Promise<ProjectModel[]> {
    return ProjectModel.findForUser(this)
  }

  /**
   * Find the named flow for this project.
   * @param name
   */
  findFlowPlan(name: string) {

  }

  /**
   * Find a user.
   * @param email
   * @returns An user instance if found or `null` otherwie.
   */
  static async find(email: string): Promise<UserModel | null> {
    return this.findUnique<prisma.User, UserModel>({ email })
  }
}
