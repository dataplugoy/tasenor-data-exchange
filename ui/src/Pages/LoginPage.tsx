import React, { useState } from 'react'
import { Box, Button, TextField } from '@mui/material'
import { Trans, useTranslation } from 'react-i18next'
import { useApp } from '../Hooks/useApp'
import { useNavigate } from 'react-router-dom'
import { usePOST } from '../Hooks/useNet'
import { AuthResponse } from '../Types/API/auth/AuthResponse'

export const LoginPage = (): React.JSX.Element => {

  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const app = useApp()
  const navigate = useNavigate()
  const POST = usePOST<AuthResponse>()

  const onLogin = () => {
    POST('/auth', { email, password }).then((res) => {
      if (res) {
        app.setAuth(res)
        // TODO: Fetch default project.
        navigate('/')
      }
    })
  }

  return <Box sx={{ p: 4, textAlign: 'center' }}>
    <img src="/Images/logo.jpeg"/>
    <Box sx={{ mt: 2 }}>
      <TextField onChange={e => setEmail(e.target.value)} value={email} name="email" label={t('Email')}/>
      <TextField onChange={e => setPassword(e.target.value)} value={password} name="password" type="password" label={t('Password')}/>
      <Box sx={{ mt: 2 }}>
        <Button onClick={onLogin}><Trans>Login</Trans></Button>
      </Box>
    </Box>
  </Box>
}
