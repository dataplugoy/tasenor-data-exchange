import fs from 'fs'
import path from 'path'
import prisma from '@prisma/client'
import { SettingsModel } from '../models/SettingsModel'
import { DriverSettings } from '../types/DriverSettings'
import { RuntimeOptions } from '../types/RuntimeOptions'
import { FlowState } from '../types/FlowState'
import { ProjectSettings } from '../types/API/Project'
import { Setup } from '../types/API/Setup'
import axios, { AxiosRequestConfig } from 'axios'
import { HttpMethod, delay, error, log } from '@tasenor/common'
import { HTTPException } from '../exceptions/HTTPException'
import { DateTime } from 'luxon'

/**
 * Base class for different input sources and output destinations supported.
 */
export class Driver {

  type: prisma.DriverType
  settings: DriverSettings
  systemSettings: SettingsModel
  projectSettings: ProjectSettings
  options: RuntimeOptions
  setup: Setup
  state: FlowState
  // This is detected version of the data. By default it is always 1.
  version: number
  // If set, make sure there will be no more than this many HTTP requests per second.
  rateLimit: number | null
  // Time stamp in milliseconds of the latest request.
  private lastRequest: number

  constructor(settings: DriverSettings, projectSettings: ProjectSettings, setup: Setup, type: prisma.DriverType) {
    this.type = type
    this.setup = setup
    this.settings = settings
    this.projectSettings = projectSettings
    this.version = 1
    this.rateLimit = null
    this.lastRequest = DateTime.now().toMillis()
  }

  /**
   * Root path of the repository.
   */
  get root(): string {
    return path.join(path.dirname(path.dirname(__dirname)), 'samples')
  }

  /**
   * If true, driver is able to handle input.
   * @returns
   */
  canHandleInput(): boolean {
    return false
  }

  /**
   * If true, driver is able to handle output.
   * @returns
   */
  canHandleOutput(): boolean {
    return false
  }

  /**
   * If true, driver is able to tell the balances and assets before the first batch.
   * @returns
   */
  canProvideOpeningState(): boolean {
    return false
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
   * A hook to perform initialization before use.
   */
  async initialize(state: FlowState, options: RuntimeOptions): Promise<FlowState> {
    this.options = options
    this.state = state
    this.systemSettings = await SettingsModel.get(this.type)

    return this.state
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
   * Get the base URL. Defaults to the system settings.
   */
  protected get baseUrl(): string {
    return this.systemSettings.url
  }

  /**
   * Ensure that URL does not have double slash in the beginning.
   * @param url Local part of the URL.
   */
  protected makeUrl(url: string): string {
    const baseUrl = this.baseUrl.replace(/\/$/, '')
    url = url.replace(/^\//, '')
    return `${baseUrl}/${url}`
  }

  /**
   * Executor for HTTP requests.
   * @param method
   */
  protected async request<T>(method: HttpMethod, url: string, data: unknown = undefined, headers: null | Record<string, string> = null): Promise<T> {
    log(`Requesting '${method} ${url}'.`)

    const now = DateTime.now().toMillis()
    if (this.rateLimit !== null) {
      const minGap = 1000 / this.rateLimit
      const need = Math.max(0, minGap - (now - this.lastRequest))
      if (need > 0) {
        await delay(need)
      }
    }

    const storePath = this.options.tracking ? path.join(this.root, this.options.tracking, url.replace(this.systemSettings.url, '')) : null
    const storeDir = storePath ? path.dirname(storePath) : null
    const storeFile = storePath ? `${method}-${path.basename(storePath)}` : null
    const savePath = storeDir && storeFile ? path.join(storeDir, storeFile) : null

    const conf: AxiosRequestConfig = {
      method,
      url,
      headers: headers || this.headers(),
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

    this.lastRequest = now
    const result = await axios(conf).catch(err => {
      let msg = err.toString()
      if (err.response && err.response.data) {
        msg = `HTTP ${err.response.status} ${JSON.stringify(err.response.data)}`
      }
      error(`Request ${method} ${url} failed:`, msg)
      throw new HTTPException(method, url, err.toString(), err.response ? err.response.status : null)
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

  /**
   * Execute PUT request.
   */
  async PUT<T>(url, data): Promise<T> {
    const resp = await this.request<T>('PUT', this.makeUrl(url), data)
    return resp
  }

  /**
   * Handle authentication to the remote.
   */
  async autheticate(): Promise<FlowState> {
    throw new Error(`Input source ${this.type} does not implement autheticate().`)
  }
}
