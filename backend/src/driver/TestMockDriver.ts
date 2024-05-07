import fs from 'fs'
import path from 'path'
import { Driver } from './Driver'
import { TestMockDriverSettings } from '../types/DriverSettings'
import { TestMockFlowState } from '../types/FlowState'
import { BatchModel } from '../models/BatchModel'
import { num } from '@tasenor/common'
import { FlowPlanModel } from '../models/FlowPlanModel'
import { InputItemModel } from '../models/InputItemModel'
import { RuleModel } from '../models/RuleModel'
import { RunModel } from '../models/RunModel'
import { OutputItemModel } from '../models/OutputItemModel'
import { InputItemData } from '../types/API/InputItemData'
import { UnifiedItem } from '../types/API/UnifiedItem'
import { ProjectSettings } from '../types/API/Project'

/**
 * A simple file based driver for providing mock data from the development tree.
 */
export class TestMockDriver extends Driver {

  declare settings: TestMockDriverSettings
  declare state: TestMockFlowState

  constructor(settings: TestMockDriverSettings, projectSettings: ProjectSettings) {
    super(settings, projectSettings, 'TEST_MOCK')
  }

  canHandleInput(): boolean {
    return true
  }

  canHandleOutput(): boolean {
    return true
  }

  async autheticate(): Promise<TestMockFlowState> {
    return this.state
  }

  async fetchData(flowPlan: FlowPlanModel): Promise<string> {

    const url = this.getURL()
    if (url.protocol !== 'file:') {
      throw new Error(`Bad protocol in URL '${this.settings.url}'.`)
    }

    const filePath = path.join(this.root, url.pathname)
    const data = fs.readFileSync(filePath).toString('utf-8')

    return data
  }

  async itemizeInput(batch: BatchModel): Promise<InputItemData[]> {
    const lines = await batch.parseCsv() as string[][]
    let lineNumber = 1
    const items: InputItemData[] = []

    for (const line of lines) {
      const item: InputItemData = {
        original: line.join(','),
        line: lineNumber++,
        time: line[0],
        text: line[1],
        total: line[2] === '' ? null : num(line[2]),
        fields: {
          word1: line[1].split(' ')[0]
        }
      }
      items.push(item)
    }

    return items
  }

  async unifyItem(flow: FlowPlanModel, run: RunModel, input: InputItemModel, rules: Record<string, RuleModel[]>): Promise<UnifiedItem> {
    return this.applyUnifyRules(flow, run, input, rules, input.fields.word1 as string)
  }

  async deliverOutput(output: OutputItemModel): Promise<void> {
    const url = this.getURL()
    if (url.protocol !== 'file:') {
      throw new Error(`Bad protocol in URL '${this.settings.url}'.`)
    }

    let n = 1
    let filePath = path.join(this.root, `${url.pathname}-${n}`)
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    while (fs.existsSync(filePath)) {
      n++
      filePath = path.join(this.root, `${url.pathname}-${n}`)
    }

    fs.writeFileSync(filePath, JSON.stringify(output.data.data, null, 2) + '\n')
  }
}
