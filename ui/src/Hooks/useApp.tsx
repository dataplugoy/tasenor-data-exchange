import React, { ReactNode, useContext, useState } from 'react'
import { Token } from '@tasenor/common'
import useLocalStorage from 'use-local-storage'
import { ProjectResponse } from '../Types/API/projects/ProjectResponse'
import { AuthResponse } from '../Types/API/auth/AuthResponse'

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
  token: Token | null // TODO: Get rid off.
  messages: Message[]
  project: ProjectResponse
  user: AuthResponse // TODO: Rename 'auth'.

  // Functions
  setToken: (token: Token | null) => void
  addInfo: (text: string) => void
  addWarning: (text: string) => void
  addError: (text: string) => void
  setProject: (project: ProjectResponse) => void
  setUser: (user: AuthResponse) => void
}

/**
 * An instance of the global context.
 */
export const AppContext = React.createContext<AppContextProps>({
  token: null,
  messages: [],
  project: {},
  user: { token: null, user: { id: 0, email: '' }},
  setToken: () => {},
  addInfo: () => {},
  addWarning: () => {},
  addError: () => {},
  setProject: () => {},
  setUser: () => {},
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
  const [project, setProject] = useState<ProjectResponse>({})
  const [user, setUser] = useState<AuthResponse>({ token: null, user: { id: 0, email: '' }})

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
      project,
      user,
      setToken,
      addInfo,
      addWarning,
      addError,
      setProject,
      setUser,
    }}>
      {props.children}
    </AppContext.Provider>
  )
}
