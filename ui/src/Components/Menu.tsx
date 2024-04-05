import { AppBar, Toolbar, Button, Box } from '@mui/material'
import { AccountTree, Home, Logout, Rule } from '@mui/icons-material'
import React from 'react'
import { Trans } from 'react-i18next'
import { useApp } from '../Hooks/useApp'
import { useNavigate } from 'react-router-dom'

export const Menu = (): React.JSX.Element => {
  const app = useApp()
  const navigate = useNavigate()

  const onLogout = () => {
    app.setAuth({ token: null, user: { id: 0, email: '' } })
    navigate('/')
  }

  if (!app.auth.token) {
    return <></>
  }

  return (
    <AppBar position="static">
      <Toolbar sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 4fr' }}>
        <Button startIcon={<Home />}><Trans>Dashboard</Trans></Button>
        <Button startIcon={<AccountTree />}><Trans>Projects</Trans></Button>
        <Button startIcon={<Rule />}><Trans>Rules</Trans></Button>
        <Box sx={{ textAlign: 'right' }}>
          <Button startIcon={<Logout />} onClick={onLogout}><Trans>Logout</Trans></Button>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
