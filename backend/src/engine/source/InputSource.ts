import path from 'path'
import axios, { AxiosRequestConfig } from 'axios'
import prisma from '@prisma/client'
import { SettingsModel } from '../../models/SettingsModel'
import { HttpMethod, error, log } from '@tasenor/common'

/**
 * Base class for different input sources supported.
 */
export class InputSource {

  type: prisma.InputSourceType
  settings: Record<string, unknown> // TODO: Define types per input model.
  systemSettings: SettingsModel

  constructor(type: prisma.InputSourceType, settings: Record<string, unknown>) {
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
  private async request(method: HttpMethod, url: string) {
    log(`Requesting ${method} ${url}`)

    const conf: AxiosRequestConfig = {
      method,
      url,
      headers: this.headers()
    }

    return axios(conf).catch(err => {
      error('Request failed: ' + JSON.stringify(err.response.data))
      throw err
    })
  }

  /**
   * Execute GET request.
   */
  async GET(url): Promise<unknown> {
    const resp = await this.request('GET', this.makeUrl(url))
    return resp.data
  }

  /**
   * A hook to perform initialization before use.
   */
  async initialize(): Promise<void> {
    this.systemSettings = await SettingsModel.get(this.type)
  }

  /**
   * Handle authentication to the remote.
   */
  async autheticate(): Promise<void> {
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
