import React, { ReactNode, useContext, useState } from 'react'
import useLocalStorage from 'use-local-storage'
import { ProjectResponse } from '../Types/API/projects/ProjectResponse'
import { AuthResponse } from '../Types/API/auth/AuthResponse'

export const DEFAULT_USER = {
  id: 0,
  email: '',
  settings: {
    projectId: 0,
    languagge: 'en',
    currency: 'EUR'
  }
}

export const DEFAULT_PROJECT = {
  id: 0,
  userId: 0,
  name: '',
  settings: {
    language: 'en',
    currency: 'EUR'
  }
}

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
  messages: Message[]
  project: ProjectResponse
  auth: AuthResponse

  // Functions
  addInfo: (text: string) => void
  addWarning: (text: string) => void
  addError: (text: string) => void
  setProject: (project: ProjectResponse) => void
  setAuth: (user: AuthResponse) => void
}

/**
 * An instance of the global context.
 */
export const AppContext = React.createContext<AppContextProps>({
  messages: [],
  project: DEFAULT_PROJECT,
  auth: { token: null, user: DEFAULT_USER },
  addInfo: () => {},
  addWarning: () => {},
  addError: () => {},
  setProject: () => {},
  setAuth: () => {},
})

/**
 * Helper hook to access global context.
 */
export const useApp = () => useContext(AppContext)

/**
 * Provider for the global context.
 */
export const AppProvider = (props: { children: ReactNode }): React.JSX.Element => {
  const [messages, setMessages] = useState<Message[]>([])
  const [timer, setTimer] = useState<null|NodeJS.Timeout>(null)
  const [project, setProject] = useLocalStorage<ProjectResponse>('project', DEFAULT_PROJECT)
  const [auth, setAuth] = useLocalStorage<AuthResponse>('auth', { token: null, user: DEFAULT_USER })

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
      messages,
      project,
      auth,
      addInfo,
      addWarning,
      addError,
      setProject,
      setAuth,
    }}>
      {props.children}
    </AppContext.Provider>
  )
}
