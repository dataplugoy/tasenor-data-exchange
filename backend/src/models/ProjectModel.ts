import { ProjectSettings } from '../types/API/Project'
import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { UserModel } from './UserModel'
import { Service } from '../lib/services/Service'

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

  /**
   * Get services for the project.
   * @param projectId
   */
  static async getServices(projectId: number): Promise<Service[]> {
    const project = await ProjectModel.get(projectId)
    if (!project) {
      throw new Error(`Failed to find flow plan model ${projectId}.`)
    }
    return UserModel.getServices(project.data.userId)
  }

  /**
   * Save user to the DB.
   * @param data
   * @returns
   */
  static async save(data: Partial<prisma.Project>): Promise<ProjectModel> {
    return ProjectModel.create<prisma.Project, ProjectModel>(data)
  }
}
