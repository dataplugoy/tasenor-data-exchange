import fs from "fs"
import path from "path"
import { InputSource } from './InputSource'

/**
 * A simple file based driver for providing mock data from the development tree.
 */
export class TestMockInput extends InputSource {

  constructor(settings: Record<string, unknown>) {
    super('TEST_MOCK_INPUT', settings)
  }

  async fetchData(_lastStamp: Date | null): Promise<string> {
    // TODO: Obey lastStamp.
    const url = this.getURL()
    if (url.protocol !== 'file:') {
      throw new Error(`Bad protocol in URL '${this.settings.url}'.`)
    }

    const filePath = path.join(this.root, url.pathname)
    const data = fs.readFileSync(filePath)

    return data.toString('utf-8')
  }
}
