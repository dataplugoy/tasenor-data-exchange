import path from 'path'
import prisma from '@prisma/client'

/**
 * Base class for different input sources supported.
 */
export class InputSource {

  type: prisma.InputSourceType
  settings: Record<string, unknown>

  constructor(type: prisma.InputSourceType, settings: Record<string, unknown>) {
    this.type = type
    this.settings = settings
  }

  /**
   * Root path of the repository.
   */
  get root(): string {
    return path.dirname(path.dirname(path.dirname(path.dirname(__dirname))))
  }

  /**
   * Ensure that `url` is defined in settings and return it.
   * @returns URL object.
   */
  getURL(): URL {
    if (!('url' in this.settings)) {
      throw new Error(`Cannot find URL from settings ${JSON.stringify(Object.keys(this.settings))}.`)
    }
    return new URL(`${this.settings.url}`)
  }

  /**
   * Handler for actual data fetching.
   * @returns New data found.
   */
  async fetchData(_lastStamp: Date | null): Promise<string> {
    throw new Error(`Input source ${this.type} does not implement fetchData().`)
  }
}
