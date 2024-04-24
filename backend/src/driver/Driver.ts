import path from 'path'
import fs from 'fs'
import axios, { AxiosRequestConfig } from 'axios'
import prisma from '@prisma/client'
import { SettingsModel } from '../models/SettingsModel'
import { HttpMethod, error, isShortDate, log } from '@tasenor/common'
import { DriverSettings } from '../types/DriverSettings'
import { RuntimeOptions } from '../types/RuntimeOptions'
import { FlowState } from '../types/FlowState'
import { BatchModel } from '../models/BatchModel'
import { InputItemModel } from '../models/InputItemModel'
import { FlowPlanModel } from '../models/FlowPlanModel'
import { RuleModel } from '../models/RuleModel'
import { InputSourceModel } from '../models/InputSourceModel'
import { applyRules } from '../lib/rules'
import { UnifiedItemModel } from '../models/UnifiedItemModel'
import { JsonValue } from '@prisma/client/runtime/library'
import { RunModel } from '../models/RunModel'
import { DateTime } from 'luxon'
import { OutputItemModel } from '../models/OutputItemModel'
import { InputItemData } from '../types/API/InputItemData'

/**
 * Base class for different input sources and output destinations supported.
 */
export class Driver {

  type: prisma.DriverType
  settings: DriverSettings
  systemSettings: SettingsModel
  options: RuntimeOptions
  state: FlowState

  constructor(type: prisma.DriverType, settings: DriverSettings) {
    this.type = type
    this.settings = settings
  }

  /**
   * Root path of the repository.
   */
  get root(): string {
    return path.join(path.dirname(path.dirname(__dirname)), 'samples')
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
   * Construct bearer token for HTTP requests, if used.
   * @returns A token, if used.
   */
  protected bearerToken(): string | null {
    return null
  }

  /**
   * Construct standard default headers for requests.
   */
  protected headers(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    const token = this.bearerToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    return headers
  }

  /**
   * Ensure that URL does not have double slash in the beginning.
   * @param url Local part of the URL.
   */
  private makeUrl(url: string): string {
    const baseUrl = this.systemSettings.url.replace(/\/$/, '')
    url = url.replace(/^\//, '')
    return `${baseUrl}/${url}`
  }

  /**
   * Executor for HTTP requests.
   * @param method
   */
  private async request<T>(method: HttpMethod, url: string, data: unknown = undefined): Promise<T> {
    log(`Requesting '${method} ${url}'.`)

    const storePath = this.options.tracking ? path.join(this.root, this.options.tracking, url.replace(this.systemSettings.url, '')) : null
    const storeDir = storePath ? path.dirname(storePath) : null
    const storeFile = storePath ? `${method}-${path.basename(storePath)}` : null
    const savePath = storeDir && storeFile ? path.join(storeDir, storeFile) : null

    const conf: AxiosRequestConfig = {
      method,
      url,
      headers: this.headers(),
      data,
    }

    if (savePath && fs.existsSync(savePath)) {
      log(`Reading result from '${savePath}'.`)
      // Supporting UTF-8 responeses for now.
      const data = fs.readFileSync(savePath).toString('utf-8')
      if (conf.headers && conf.headers['Content-Type'] === 'application/json') {
        return JSON.parse(data)
      }
      return data as T
    }

    const result = await axios(conf).catch(err => {
      error('Request failed: ' + JSON.stringify(err.response.data))
      throw err
    })

    if (storeDir && savePath) {
      log(`Saving result to '${savePath}'.`)
      fs.mkdirSync(storeDir, { recursive: true })
      fs.writeFileSync(savePath, typeof result.data === 'string' ? result.data : JSON.stringify(result.data))
    }

    return result.data
  }

  /**
   * Execute GET request.
   */
  async GET<T>(url): Promise<T> {
    const resp = await this.request<T>('GET', this.makeUrl(url))
    return resp
  }

  /**
   * Execute DELETE request.
   */
  async DELETE<T>(url): Promise<T> {
    const resp = await this.request<T>('DELETE', this.makeUrl(url))
    return resp
  }

  /**
   * Execute POST request.
   */
  async POST<T>(url, data): Promise<T> {
    const resp = await this.request<T>('POST', this.makeUrl(url), data)
    return resp
  }

  /* ACTUAL FLOW STEPS */

  /**
   * A hook to perform initialization before use.
   */
  async initialize(state: FlowState, options: RuntimeOptions): Promise<FlowState> {
    this.options = options
    this.state = state
    this.systemSettings = await SettingsModel.get(this.type)

    return this.state
  }

  /**
   * Handle authentication to the remote.
   */
  async autheticate(): Promise<FlowState> {
    throw new Error(`Input source ${this.type} does not implement autheticate().`)
  }

  /**
   * Handler for actual data fetching.
   * @returns New data found.
   */
  async fetchData(_lastStamp: Date | null): Promise<string> {
    throw new Error(`Input source ${this.type} does not implement fetchData().`)
  }

  /**
   * Take the input batch fetched and provide a list of processable input items.
   */
  async itemizeInput(batch: BatchModel): Promise<InputItemData[]> {
    throw new Error(`Input source ${this.type} does not implement itemizeInput().`)
  }

  /**
   * Load rules to the database.
   */
  async initializeRules(flow: FlowPlanModel): Promise<Record<string, RuleModel[]>> {
    const source = await InputSourceModel.findForFlow(flow.id)
    log(`Initializing rules for ${source}.`)

    const rulePath = path.join(__dirname, 'rules', `${this.constructor.name}.json`)
    const rulesData = JSON.parse(fs.readFileSync(rulePath, 'utf-8'))
    const rules: Record<string, RuleModel[]> = {}

    for (const ruleItem of rulesData) {
      if (!rules[ruleItem.key]) {
        rules[ruleItem.key] = []
      }

      const rule = await RuleModel.save({
        filterView: {},
        resultView: {},
        ...ruleItem,
        type: 'INPUT_SOURCE',
        ownerId: source?.id
      })
      log(`Created ${rule} called '${ruleItem.name}' for ${flow}.`)

      rules[ruleItem.key].push(rule)
    }

    return rules
  }

  /**
   * Helper to implement rule based handling for unifying input items.
   * @param flow
   * @param input
   * @param rules
   */
  protected async applyUnifyRules(flow: FlowPlanModel, run: RunModel, input: InputItemModel, rules: Record<string, RuleModel[]>, ruleKey: string | null = null): Promise<UnifiedItemModel> {
    if (RuleModel.count(rules) === 0) {
      throw new Error(`There are no rules available in ${flow} for unifying input.`)
    }

    const variables = {
      text: input.text,
      line: input.line,
      time: input.time,
      total: input.total,
      original: input.original,
      ...input.fields
    }

    const data: Record<string, unknown> = applyRules(variables, rules, ruleKey) as Record<string, unknown>

    const time = isShortDate(input.time)
      ? DateTime.fromISO(`${input.time}T12:00:00Z`).toUTC().toISO()
      : DateTime.fromISO(`${input.time}`).toUTC().toISO()

    const unified = await UnifiedItemModel.save({
      data: data as JsonValue,
      time: new Date(time as string),
      processed: false,
      skipped: false,
      flowPlanId: input.data.flowPlanId,
      batchId: input.data.batchId,
      runId: run.id,
      inputId: input.id,
    })

    return unified
  }

  /**
   * Take an input item and convert it to the unified model.
   */
  async unifyItem(flow: FlowPlanModel, run: RunModel, input: InputItemModel, rules: Record<string, RuleModel[]>): Promise<UnifiedItemModel> {
    throw new Error(`Input source ${this.type} does not implement unifyItem().`)
  }

  async deliverOutput(output: OutputItemModel): Promise<void> {
    throw new Error(`Input source ${this.type} does not implement deliverOutput().`)
  }
}
