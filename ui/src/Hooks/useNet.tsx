import axios from 'axios'
import { AppContextProps, DEFAULT_AUTH, useApp } from './useApp'
import { HttpMethod } from '@tasenor/common'
import { useTranslation } from 'react-i18next'

const API_VERSION = 'v1'
const cache: Record<string, Promise<any>> = {}

/**
 * Helper to run HTTP requests.
 */
async function request<T>(t, app: AppContextProps, method: HttpMethod, url: string, data: Record<string, unknown> | undefined = undefined): Promise<T> {

  const headers: { Authorization?: string } = {}

  if (app.auth.token) {
    headers.Authorization = `Bearer ${app.auth.token}`
  }

  if (method === 'GET' && url in cache) return cache[url]

  const promise = axios({
    method,
    url: `/api/${API_VERSION}${url}`,
    data,
    headers,
  })
    .then(res => {
      if (method === 'GET') delete cache[url]
      return res.data
    })
    .catch(err => {
      if (method === 'GET') delete cache[url]
      const msg = err.response && err.response.data && err.response.data.message ? t(err.response.data.message) : err.message
      app.addError(msg)
      if (err.response.status === 401) {
        app.setAuth(DEFAULT_AUTH)
        document.location = '/'
      }
      return null
    })

  if (method === 'GET') {
    cache[url] = promise
  }

  return promise
}

/**
 * Execute GET request and handle errors.
 * @returns
 */
export function useGET<T>() {
  const { t } = useTranslation()
  const app = useApp()

  return (url: string): Promise<T | null> => request<T | null>(t, app, 'GET', url)
}

/**
 * Execute PATCH request and handle errors.
 * @returns
 */
export function usePATCH<T>() {
  const { t } = useTranslation()
  const app = useApp()

  return (url: string, data: Record<string, unknown>): Promise<T | null> => request<T | null>(t, app, 'PATCH', url, data)
}

/**
 * Execute POST request and handle errors.
 * @returns
 */
export function usePOST<T>() {
  const { t } = useTranslation()
  const app = useApp()

  return (url: string, data: Record<string, unknown>): Promise<T | null> => request<T | null>(t, app, 'POST', url, data)
}
