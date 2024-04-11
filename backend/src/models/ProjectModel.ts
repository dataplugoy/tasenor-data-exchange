import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'
import { FlowPlanModel } from './FlowPlanModel'
import { ProjectSettings } from '../types/ProjectSettings'

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

  static async findForFlow(flow: FlowPlanModel): Promise<ProjectModel> {
    return this.findById<prisma.Project, ProjectModel>(flow.data.projectId)
  }

  static async get(id: number): Promise<ProjectModel> {
    return this.findById<prisma.Project, ProjectModel>(id)
  }
}
