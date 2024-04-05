import React, { useEffect } from 'react'
import { useApp } from '../Hooks/useApp'
import { useNavigate } from 'react-router-dom'

export const IndexPage = (): React.JSX.Element => {
  const app = useApp()
  const navigate = useNavigate()

  useEffect(() => {
    if (!app.auth.token) {
      navigate('/login')
    } else {
      navigate('/home')
    }
  }, [app.auth.token])

  return <></>
}
