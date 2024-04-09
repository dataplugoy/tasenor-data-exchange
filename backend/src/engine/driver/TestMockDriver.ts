import fs from 'fs'
import path from 'path'
import { DateTime } from 'luxon'
import { Driver } from './Driver'
import { TestMockInputSettings } from '../../types/InputSettings'
import { TestMockFlowState } from '../../types/FlowState'
import { BatchModel } from '../../models/BatchModel'
import { PreprocessedInput } from '../../types/PreprocessedInput'
import { num } from '@tasenor/common'
import { FlowPlanModel } from '../../models/FlowPlanModel'
import { InputItemModel } from '../../models/InputItemModel'
import { RuleModel } from '../../models/RuleModel'
import { RunModel } from '../../models/RunModel'
import { UnifiedItemModel } from '../../models/UnifiedItemModel'

// TODO: Could add first(), second(), third() functions for regex() rule.

/**
 * A simple file based driver for providing mock data from the development tree.
 */
export class TestMockDriver extends Driver {

  declare settings: TestMockInputSettings
  declare state: TestMockFlowState

  constructor(settings: TestMockInputSettings) {
    super('TEST_MOCK', settings)
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

  async itemizeInput(batch: BatchModel): Promise<PreprocessedInput[]> {
    const lines = batch.parseCsv()
    let lineNumber = 1
    const items: PreprocessedInput[] = []

    for (const line of lines) {
      const item: PreprocessedInput = {
        original: line.join(','),
        line: lineNumber++,
        time: line[0],
        text: line[1],
        total: num(line[2]),
        fields: {
          word1: line[1].split(' ')[0]
        }
      }
      items.push(item)
    }

    return items
  }

  async unifyItem(flow: FlowPlanModel, run: RunModel, input: InputItemModel, rules: Record<string, RuleModel[]>): Promise<UnifiedItemModel> {
    return this.applyUnifyRules(flow, run, input, rules, input.fields.word1 as string)
  }
}
