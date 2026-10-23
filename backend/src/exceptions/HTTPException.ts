import { HttpMethod } from '@tasenor/common'

/**
 * Error in communications.
 */
export class HTTPException extends Error {
  method: HttpMethod
  url: string
  // HTTP status of the response or null, if there was no response.
  status: number | null

  constructor(method: HttpMethod, url: string, msg: string, status: number | null = null) {
    super(`${method} ${url}: ${msg}`)
    this.method = method
    this.url = url
    this.status = status
  }
}
