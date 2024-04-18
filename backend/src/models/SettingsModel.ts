import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'

export class SettingsModel extends BaseModel<prisma.Settings> {

  static table = 'settings'
  static construct = SettingsModel

  get type(): prisma.DriverType {
    return this.data.type
  }

  private getOrThrow<T>(name: string): T {
    if (!(name in this.data)) {
      throw new Error(`Invalid setting '${name}' queried for system settings of '${this.type}'.`)
    }
    if (!this.data[name]) {
      throw new Error(`Setting '${name}' is not set for system settings of '${this.type}'.`)
    }
    return this.data[name] as T

  }

  get url(): string {
    return this.getOrThrow('url')
  }

  get apikey(): string {
    return this.getOrThrow('apikey')
  }

  get certificate(): string {
    return this.getOrThrow('certificate')
  }

  static async get(type: prisma.DriverType): Promise<SettingsModel> {
    const settings = await this.findUnique<prisma.Settings, SettingsModel>({ type })
    if (!settings) {
      throw new Error(`Cannot find system level settings for ${type}.`)
    }
    return settings
  }
}
