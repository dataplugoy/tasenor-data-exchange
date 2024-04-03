import fs from 'fs'
import path from 'path'
import { DateTime } from 'luxon'
import { InputSource } from './InputSource'
import { TestMockInputSettings } from '../../types/InputSettings'

/**
 * A simple file based driver for providing mock data from the development tree.
 */
export class TestMockInput extends InputSource {

  declare settings: TestMockInputSettings

  constructor(settings: TestMockInputSettings) {
    super('TEST_MOCK_INPUT', settings)
  }

  async autheticate(): Promise<void> {
  }

  async fetchData(lastStamp: Date | null): Promise<string> {

    const url = this.getURL()
    if (url.protocol !== 'file:') {
      throw new Error(`Bad protocol in URL '${this.settings.url}'.`)
    }

    const filePath = path.join(this.root, url.pathname)
    const data = fs.readFileSync(filePath).toString('utf-8')

    if (lastStamp) {
      const stamp = DateTime.fromJSDate(lastStamp).toISO()
      return data.split('\n').filter(line => line === '' || line >= stamp).join('\n')
    }

    return data
  }
}
