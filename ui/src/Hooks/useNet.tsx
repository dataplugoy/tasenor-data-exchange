import axios from 'axios'
import { AppContextProps, useApp } from "./useApp"
import { HttpMethod } from '@tasenor/common'
import { useTranslation } from 'react-i18next'

// TODO: Add '/api/v1' here. Handle 'v1' in backend.

/**
 * Helper to run HTTP requests.
 */
async function request<T>(t, app: AppContextProps, method: HttpMethod, url: string, data: Record<string, unknown> | undefined = undefined): Promise<T> {
  return axios({
    method,
    url,
    data
  })
  .then(res => res.data)
  .catch(err => {
    const msg = err.response && err.response.data && err.response.data.message ? t(err.response.data.message) : err.message
    app.addError(msg)
    return null
  }) as T
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
 * Execute POST request and handle errors.
 * @returns
 */
export function usePOST<T>() {
  const { t } = useTranslation()
  const app = useApp()

  return (url: string, data: Record<string, unknown>): Promise<T | null> => request<T | null>(t, app, 'POST', url, data)
}
