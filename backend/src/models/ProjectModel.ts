import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { UserModel } from './UserModel'

export class ProjectModel extends BaseModel<prisma.Project> {

  static table = 'project'
  static construct = ProjectModel

  /**
   * Get a list of all projects the user has.
   */
  static async findForUser(user: UserModel): Promise<ProjectModel[]> {
    return this.findMany<prisma.Project, ProjectModel>({ userId: user.id })
  }
}
