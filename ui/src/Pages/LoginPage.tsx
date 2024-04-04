import React, { useState } from 'react'
import { Box, Button, TextField } from '@mui/material'
import { Trans, useTranslation } from 'react-i18next'

export const LoginPage = (): React.JSX.Element =>  {

  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const onLogin = () => {
    console.log('TODO: Login')
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
