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
import { DateTime } from 'luxon'
import { Setup } from '../types/API/Setup'
import { RemoteId } from '../types/API/RemoteId'

/**
 * A simple file based driver for providing mock data from the development tree.
 */
export class TestMockDriver extends Driver {

  declare settings: TestMockDriverSettings
  declare state: TestMockFlowState

  constructor(settings: TestMockDriverSettings, projectSettings: ProjectSettings, setup: Setup = {}) {
    super(settings, projectSettings, setup, 'TEST_MOCK')
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

    let filePath = path.join(this.root, url.pathname)

    const addPostfix = (postfix: string) => {
      filePath = path.join(
        this.root,
        path.dirname(url.pathname),
        path.basename(url.pathname, path.extname(url.pathname)) + postfix + path.extname(url.pathname)
      )
    }

    if (flowPlan.lastStamp !== null) {
      switch (flowPlan.lastStamp && DateTime.fromJSDate(flowPlan.lastStamp).toFormat('yyyy-LL-dd')) {
        case '2000-01-01':
          addPostfix('-2')
          break
        case '2001-02-01':
          addPostfix('-3')
          break
        case '2001-03-01':
          addPostfix('-4')
          break
        case '2001-04-01':
          addPostfix('-5')
          break
        default:
          return ''
      }
    }
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

  async deliverOutput(output: OutputItemModel): Promise<RemoteId> {
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

    return { type: 'FILE', path: filePath }
  }

  /**
   * An example to ignore line number from the hash.
   * @param input
   * @returns
   */
  inputHash(input: InputItemData): string {
    return super.inputHash({ ...input, line: 0 })
  }
}
