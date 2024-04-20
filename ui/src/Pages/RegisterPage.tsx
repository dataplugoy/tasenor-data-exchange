import React, { useState } from 'react'
import { Box, Button, TextField } from '@mui/material'
import { Trans, useTranslation } from 'react-i18next'
import { usePOST } from '../Hooks/useNet'
import { AuthResponse } from '../Types/API/auth/AuthResponse'
import { useApp } from '../Hooks/useApp'

export const RegisterPage = (): React.JSX.Element => {

  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordAgain, setPasswordAgain] = useState('')
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [zip, setZip] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const POST = usePOST<AuthResponse>()
  const app = useApp()

  const onRegister = () => {

    if (password !== passwordAgain) {
      app.addError(t('Passwords do not match.'))
      return
    }

    POST('/auth/register', { email, password, name, address, zip, city, country }).then(async (res) => {
    })
  }


  return <Box sx={{ mt: 10, textAlign: 'center', ml: '25%' }}>
    <Box sx={{ display: 'grid', gridTemplateColumns: '50%', rowGap: '1rem' }}>
      <Trans>Register to Tasenor Data Exchange</Trans>
      <TextField autoComplete="off" required fullWidth onChange={e => setEmail(e.target.value)} value={email} name="email" label={t('Email')}/>
      <TextField autoComplete="off" required fullWidth onChange={e => setPassword(e.target.value)} value={password} name="password" type="password" label={t('Password')}/>
      <TextField autoComplete="new-password" required fullWidth onChange={e => setPasswordAgain(e.target.value)} value={passwordAgain} name="password-again" type="password" label={t('Password Again')}/>
      <TextField fullWidth onChange={e => setName(e.target.value)} value={name} name="name" label={t('Name')}/>
      <TextField fullWidth onChange={e => setAddress(e.target.value)} value={address} name="address" label={t('Address')}/>
      <Box sx={{ display: 'flex' }}>
        <TextField onChange={e => setZip(e.target.value)} value={zip} name="name" label={t('Zip')}/>
        <TextField onChange={e => setCity(e.target.value)} value={city} name="name" label={t('City')}/>
      </Box>
      <TextField fullWidth onChange={e => setCountry(e.target.value)} value={country} name="address" label={t('Country')}/>
      <Box sx={{ mt: 2 }}>
        <Button onClick={onRegister} variant="outlined"><Trans>Register</Trans></Button>
      </Box>
    </Box>
  </Box>
}
