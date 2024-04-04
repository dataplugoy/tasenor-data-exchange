import axios from 'axios'
import { AppContextProps, useApp } from "./useApp"
import { HttpMethod } from '@tasenor/common'
import { useTranslation } from 'react-i18next'

/**
 * Helper to run HTTP requests.
 */
async function request<T>(t, app: AppContextProps, method: HttpMethod, data: Record<string, unknown>): Promise<T> {
  return axios({
    method: 'POST',
    url: '/api/auth',
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
 * Execute POST request and handle errors.
 * @returns
 */
export function usePOST<T>() {
  const { t } = useTranslation()
  const app = useApp()

  return (data: Record<string, unknown>): Promise<T | null> => request<T | null>(t, app, 'POST', data)
}
