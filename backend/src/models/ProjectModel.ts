import { ProjectSettings } from '../types/API/Project'
import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'

export class ProjectModel extends BaseModel<prisma.Project> {

  static table = 'project'
  static construct = ProjectModel

  get name(): string {
    return this.data.name
  }

  get settings(): ProjectSettings {
    return this.data.settings as unknown as ProjectSettings
  }

  /**
   * Get a list of all projects the user has.
   */
  static async findForUser(userId: number): Promise<ProjectModel[]> {
    return this.findMany<prisma.Project, ProjectModel>({ userId })
  }

  static async get(id: number): Promise<ProjectModel | null> {
    return this.findUnique<prisma.Project, ProjectModel>({ id })
  }
}
