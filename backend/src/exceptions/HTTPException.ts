import prisma from '@prisma/client'
import { HttpMethod } from '@tasenor/common'

/**
 * Error in communications.
 */
export class HTTPException extends Error {
  method: HttpMethod
  url: string

  constructor(method: HttpMethod, url: string, msg: string) {
    super(`${method} ${url}: ${msg}`)
    this.method = method
    this.url = url
  }
}
