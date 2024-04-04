import path from 'path'
import fs from 'fs'
import axios, { AxiosRequestConfig } from 'axios'
import prisma from '@prisma/client'
import { SettingsModel } from '../../models/SettingsModel'
import { HttpMethod, error, log } from '@tasenor/common'
import { InputSettings } from '../../types/InputSettings'
import { InputOptions } from '../../types/InputOptions'
import { FlowState } from '../../types/FlowState'

/**
 * Base class for different input sources supported.
 */
export class InputSource {

  type: prisma.InputSourceType
  settings: InputSettings
  systemSettings: SettingsModel
  options: InputOptions
  state: FlowState

  constructor(type: prisma.InputSourceType, settings: InputSettings) {
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
  async initialize(state: FlowState, options: InputOptions): Promise<FlowState> {
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
}
