import React, { ReactNode, useContext } from 'react'
import { Token } from '@tasenor/common'
import useLocalStorage from 'use-local-storage'

/**
 * Items in application context.
 */
export interface AppContextProps {
  token: Token | null
}

/**
 * An instance of the global context.
 */
export const AppContext = React.createContext<AppContextProps>({
  token: null
})

/**
 * Helper hook to access global context.
 */
export const useApp = () => useContext(AppContext)

/**
 * Provider for the global context.
 */
export const AppProvider = (props: { children: ReactNode }): JSX.Element => {
  const [token, setToken] = useLocalStorage('token', null)

  return (
    <AppContext.Provider value={{
      token
    }}>
      {props.children}
    </AppContext.Provider>
  )
}
