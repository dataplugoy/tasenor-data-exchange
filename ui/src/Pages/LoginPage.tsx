import React, { useState } from 'react'
import { Box, Button, TextField } from '@mui/material'
import { Trans, useTranslation } from 'react-i18next'
import axios from 'axios'
import { useApp } from '../Hooks/useApp'
import { useNavigate } from 'react-router-dom'

export const LoginPage = (): React.JSX.Element =>  {

  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const app = useApp()
  const navigate = useNavigate()

  const onLogin = () => {
    // TODO: Make common HTTP-service.
    // TODO: Define login response as type.
    axios({
      method: 'POST',
      url: '/api/auth',
      data: {
        email, password
      }
    }).then(res => {
      app.setToken(res.data.token)
      navigate('/')
    }).catch(err => {
      app.addError(t('Invalid user or password.'))
    })
  }

  return <Box sx={{ p: 4, textAlign: 'center' }}>
    <img src="/Images/logo.jpeg"/>
    <Box>
      <TextField onChange={e => setEmail(e.target.value)} value={email} name="email" label={t('Email')}/>
      <TextField onChange={e => setPassword(e.target.value)} value={password} name="password" type="password" label={t('Password')}/>
      <Box sx={{ mt: 2 }}>
        <Button onClick={onLogin}><Trans>Login</Trans></Button>
      </Box>
    </Box>
  </Box>
}
