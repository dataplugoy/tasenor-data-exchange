import i18next from 'i18next'
import React, { useEffect, useState } from 'react'
import { Box, Button, Card, TextField, Typography } from '@mui/material'
import { Trans, useTranslation } from 'react-i18next'
import { useApp } from '../Hooks/useApp'
import { useNavigate, Link, useParams } from 'react-router-dom'
import { useGET, usePOST } from '../Hooks/useNet'
import { AuthResponse } from '../Types/API/auth/AuthResponse'
import { ProjectResponse } from '../Types/API/projects/ProjectResponse'
import logo from '../Images/logo.jpeg'

export const LoginPage = (): React.JSX.Element => {

  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const app = useApp()
  const navigate = useNavigate()
  const POST = usePOST<AuthResponse>()
  const GET = useGET<ProjectResponse>()
  const params = useParams()

  useEffect(() => {
    if (params.lang) {
      i18next.changeLanguage(params.lang)
      localStorage.setItem('language', params.lang)
    }
  }, [])

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

  let docs = 'https://data-exchange.stg.tasenor.com'

  if (NODE_ENV === 'prod') {
    docs = 'https://data-exchange.tasenor.com'
  /* eslint-disable-next-line */
} else if (NODE_ENV === 'dev') {
    docs = 'http://localhost:7304'
  }

  if (i18next.language !== 'en') {
    docs += `/${i18next.language}`
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onLogin()
  }

  return <Box sx={{ display: 'flex', justifyContent: 'center', pt: { xs: 2, sm: 6 } }}>
    <Card sx={{ width: '100%', maxWidth: '26rem' }}>
      <Box component="img" src={logo} alt="Tasenor Data Exchange" sx={{ display: 'block', width: '100%', aspectRatio: '2 / 1', objectFit: 'cover' }}/>
      <Box component="form" onSubmit={onSubmit} sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField onChange={e => setEmail(e.target.value)} value={email} name="email" label={t('Email')} autoComplete="username" fullWidth/>
        <TextField onChange={e => setPassword(e.target.value)} value={password} name="password" type="password" label={t('Password')} autoComplete="current-password" fullWidth/>
        <Button type="submit" variant="contained" size="large"><Trans>Login</Trans></Button>
        <Button onClick={onRegister}><Trans>Register</Trans></Button>
      </Box>
      <Box sx={{ px: 3, pb: 3, display: 'flex', flexDirection: 'column', gap: 1, textAlign: 'center' }}>
        <Typography variant="body2"><Link to={docs} style={{ color: 'inherit' }}><Trans>Check out the documentation</Trans></Link></Typography>
        <Typography variant="body2"><Link to="https://www.tasenor.com/" target="_blank" style={{ color: 'inherit' }}><Trans>Check also our bookkeeping app of the choice!</Trans></Link></Typography>
      </Box>
    </Card>
  </Box>
}
