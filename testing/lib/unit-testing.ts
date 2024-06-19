import fs from 'fs'
import { BaseModel } from '../../backend/src/models/BaseModel'
import { connect } from '../../backend/src/connect'
import { cwd } from 'process'
import path from 'path'
import { BatchModel } from '../../backend/src/models/BatchModel'
import { InputItemData } from '../../backend/src/types/API/InputItem'
import { InputItemModel } from '../../backend/src/models/InputItemModel'
import { JsonObject, JsonValue } from '@prisma/client/runtime/library'
import { RunModel } from '../../backend/src/models/RunModel'
import { RuleModel } from '../../backend/src/models/RuleModel'
import { FlowPlanModel } from '../../backend/src/models/FlowPlanModel'
import { UnifiedItemModel } from '../../backend/src/models/UnifiedItemModel'
import { Transaction } from '../../backend/src/types/API/Transaction'
import { Stock } from '../../backend/src/lib/Stock'
import { Analyzer } from '../../backend/src/lib/analyzer/Analyzer'
import { DateTime } from 'luxon'
import chardet from 'chardet'
import { parseEncoding } from '../../backend/src/lib/utils'
import { UnifiedItem } from '../../backend/src/types/API/UnifiedItem'
import { ProjectSettings } from '../../backend/src/types/API/Project'
import { InputDriver } from '../../backend/src/driver/InputDriver'
import { Setup } from '../../backend/src/types/API/Setup'

/**
 * Set up the dtabase for testing with DB models.
 */
export async function beforeModelTesting(): Promise<void> {

  const { spawnSync } = require('child_process')
  const databaseDir = path.join(cwd(), '..', 'database')
  const run = spawnSync('pnpm', ['-C', databaseDir, 'load'])
  if (run.stderr.toString().trim() !== '') {
    throw new Error(`Database initialization failed: ${run.stderr.toString().trim()}`)
  }

  BaseModel.setDb(await connect())
}

/**
 * Construct a batch model from test data.
 * @param filePath
 */
export function createBatchFrom(filePath: string): BatchModel {
  const data = fs.readFileSync(path.join(__dirname, '..', 'unit', 'data', filePath))
  const encoding = chardet.detect(data)
  return new BatchModel({
    id: 0,
    created: new Date(),
    updated: new Date(),
    completed: null,
    number: 1,
    state: 'DATA_FETCHED',
    data,
    encoding: parseEncoding(encoding as string),
    lastStamp: null,
    initialStock: {},
    endStock: {},
    initialBalance: {},
    endBalance: {},
    flowPlanId: 0
  })
}

/**
 * Generate rules from the original source data JSON file.
 */
export function createRulesFrom(filePath: string): Record<string, RuleModel[]> {
  const rulesData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'backend', 'src', 'driver', 'rules', filePath)).toString('utf-8'))

  const rules: Record<string, RuleModel[]> = {}
  for (const ruleItem of rulesData) {
    const key = ruleItem.key || ''
    if (!rules[key]) {
      rules[key] = []
    }

    const rule = new RuleModel({
      filterView: {},
      resultView: {},
      ...ruleItem,
      type: 'INPUT_SOURCE',
      ownerId: 0
    })

    rules[key].push(rule)
  }

  return rules
}

/**
 * Generate arguments for driver's unifyItem() function from input data.
 */
export function unifyArgsFrom(items: InputItemData[]): [FlowPlanModel, RunModel, InputItemModel[], Record<string, RuleModel[]>] {

  const flowPlan = new FlowPlanModel({
    id: 0,
    created: new Date(),
    updated: new Date(),
    firstDate: new Date('1900-01-01'),
    title: 'Unit Test Mock',
    state: {},
    projectId: 0,
    lastStamp: null,
    stock: {},
    balance: {},
    setup: {},
  })

  const inputItems = items.map(item => new InputItemModel({
    id: 0,
    created: new Date(),
    updated: new Date(),
    data: item as unknown as JsonValue,
    runId: 0,
    flowPlanId: 0,
    batchId: 0,
    processed: false,
    skipped: false,
    hash: '',
    skipReason: null
  }))

  const run = new RunModel({
    id: 0,
    created: new Date(),
    updated: new Date(),
    initialState: 'DATA_PARSED',
    finalState: 'DATA_PARSED',
    done: 0,
    total: items.length,
    error: null,
    result: 'ALL_SUCCESS',
    batchId: 0,
    notes: {},
  })

  const rules = createRulesFrom('NordnetDriver.json')

  return [flowPlan, run, inputItems, rules]
}

/**
 * Run unifying test using the driver.
 * @param items
 */
export async function unifyItems(driver: InputDriver, items: InputItemData[]): Promise<UnifiedItemModel[]> {
  const unified: UnifiedItemModel[] = []
  const partial: Record<string, UnifiedItem[]> = {}

  const [flowPlan, run, inputItems, rules] = unifyArgsFrom(items)
  for (const input of inputItems) {
    const item = await driver.unifyItem(flowPlan, run, input, rules)
    if (item.data.multipart !== undefined) {
      if (!partial[item.data.multipart]) {
        partial[item.data.multipart] = []
      }
      partial[item.data.multipart].push(item)
    } else {
      unified.push(new UnifiedItemModel({
        id: 0,
        created: new Date(),
        updated: new Date(),
        time: new Date(item.time),
        data: item.data as unknown as JsonObject,
        stockChange: {},
        processed: false,
        skipped: false,
        skipReason: null,
        inputId: 0,
        flowPlanId: 0,
        batchId: 0,
        runId: 0,
      }))
    }
  }

  FlowPlanModel.combineMultipart(partial).forEach(item => {
    unified.push(new UnifiedItemModel({
      id: 0,
      created: new Date(),
      updated: new Date(),
      time: new Date(item.time),
      data: item.data as unknown as JsonObject,
      stockChange: {},
      processed: false,
      skipped: false,
      skipReason: null,
      inputId: 0,
      flowPlanId: 0,
      batchId: 0,
      runId: 0,
    }))
  })

  unified.sort((a, b) => (a.data.time === b.data.time ? 0 : (a.data.time < b.data.time ? -1 : 1)))

  return unified
}

export async function analyzeItems(items: UnifiedItemModel[], config: ProjectSettings, setup: Setup | null = null): Promise<Transaction[]> {
  const stock = new Stock({})
  const analyzer = new Analyzer(
    config,
    stock,
    {},
    setup ||
    {
      settings: {
        skipDeposits: false,
        skipWithdrawals: false,
        allowShortSelling: true,
      }
    },
    { userId: 0, flowPlanId: 0 }
  )

  const txs: Transaction[] = []

  for (const unified of items) {
    const tx: Transaction = await analyzer.analyze(DateTime.fromJSDate(unified.data.time).toUTC(), unified.input)
    analyzer.apply(tx)
    txs.push(tx)
  }

  return txs
}
