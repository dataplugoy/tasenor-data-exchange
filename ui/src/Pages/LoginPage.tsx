import React, { useState } from 'react'
import { Box, Button, TextField } from '@mui/material'
import { Trans, useTranslation } from 'react-i18next'
import { useApp } from '../Hooks/useApp'
import { useNavigate } from 'react-router-dom'
import { useGET, usePOST } from '../Hooks/useNet'
import { AuthResponse } from '../Types/API/auth/AuthResponse'
import { ProjectResponse } from '../Types/API/projects/ProjectResponse'

export const LoginPage = (): React.JSX.Element => {

  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const app = useApp()
  const navigate = useNavigate()
  const POST = usePOST<AuthResponse>()
  const GET = useGET<ProjectResponse>()

  const onLogin = () => {
    POST('/auth', { email, password }).then(async (res) => {
      if (res) {
        app.setAuth(res)
        GET(`/projects/${res.user.settings.projectId}?token=${res.token}`).then(res => {
          res && app.setProject(res)
          navigate('/')
        })
      }
    })
  }

  const onRegister = () => {
    navigate('/register')
  }

  return <Box sx={{ p: 4, textAlign: 'center' }}>
    <img src="/Images/logo.jpeg"/>
    <Box sx={{ mt: 2 }}>
      <TextField onChange={e => setEmail(e.target.value)} value={email} name="email" label={t('Email')}/>
      <TextField onChange={e => setPassword(e.target.value)} value={password} name="password" type="password" label={t('Password')}/>
      <Box sx={{ mt: 2 }}>
        <Button onClick={onLogin} variant="outlined"><Trans>Login</Trans></Button>
      </Box>
      <Box sx={{ mt: 2 }}>
        <Button onClick={onRegister}><Trans>Register</Trans></Button>
      </Box>
    </Box>
  </Box>
}
