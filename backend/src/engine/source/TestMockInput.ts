import fs from 'fs'
import path from 'path'
import { DateTime } from 'luxon'
import { InputSource } from './InputSource'
import { TestMockInputSettings } from '../../types/InputSettings'
import { TestMockFlowState } from '../../types/FlowState'

/**
 * A simple file based driver for providing mock data from the development tree.
 */
export class TestMockInput extends InputSource {

  declare settings: TestMockInputSettings
  declare state: TestMockFlowState

  constructor(settings: TestMockInputSettings) {
    super('TEST_MOCK_INPUT', settings)
  }

  async autheticate(): Promise<TestMockFlowState> {
    return this.state
  }

  async fetchData(lastStamp: Date | null): Promise<string> {

    const url = this.getURL()
    if (url.protocol !== 'file:') {
      throw new Error(`Bad protocol in URL '${this.settings.url}'.`)
    }

    const filePath = path.join(this.root, url.pathname)
    const data = fs.readFileSync(filePath).toString('utf-8')

    if (lastStamp) {
      const stamp: string = DateTime.fromJSDate(lastStamp).toISO() as string
      return data.split('\n').filter(line => line === '' || line >= stamp).join('\n')
    }

    return data
  }
}
