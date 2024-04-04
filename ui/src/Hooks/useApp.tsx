import React, { ReactNode, useContext, useState } from 'react'
import { Token } from '@tasenor/common'
import useLocalStorage from 'use-local-storage'

/**
 * Severity of the message.
 */
export type MessageType = 'error' | 'warning' | 'info'

/**
 * Content of the message.
 */
export type Message = {
  type: MessageType,
  text: string
}

/**
 * Items in application context.
 */
export interface AppContextProps {
  // Data
  token: Token | null
  messages: Message[]

  // Functions
  setToken: (token: Token | null) => void
  addInfo: (text: string) => void
  addWarning: (text: string) => void
  addError: (text: string) => void
}

/**
 * An instance of the global context.
 */
export const AppContext = React.createContext<AppContextProps>({
  token: null,
  messages: [],
  setToken: () => {},
  addInfo: () => {},
  addWarning: () => {},
  addError: () => {},
})

/**
 * Helper hook to access global context.
 */
export const useApp = () => useContext(AppContext)

/**
 * Provider for the global context.
 */
export const AppProvider = (props: { children: ReactNode }): JSX.Element => {
  const [token, setToken] = useLocalStorage<Token | null>('token', null)
  const [messages, setMessages] = useState<Message[]>([])
  const [timer, setTimer] = useState<null|NodeJS.Timeout>(null)

  const addMessage = (type: MessageType, text: string) => {
    if (timer) clearTimeout(timer)

    setMessages((messages) => messages.concat({ type, text }))

    setTimer(setTimeout(() => {
      setMessages([])
    }, 6000))
  }

  const addInfo = (text: string) => {
    addMessage('info', text)
  }

  const addWarning = (text: string) => {
    addMessage('warning', text)
  }

  const addError = (text: string) => {
    addMessage('error', text)
  }


  return (
    <AppContext.Provider value={{
      token,
      messages,
      setToken,
      addInfo,
      addWarning,
      addError,
    }}>
      {props.children}
    </AppContext.Provider>
  )
}
