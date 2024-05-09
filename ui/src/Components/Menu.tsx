import { AppBar, Toolbar, Button, Box } from '@mui/material'
import { AccountTree, Home, Logout, MiscellaneousServices, Rule, Settings } from '@mui/icons-material'
import React from 'react'
import { Trans } from 'react-i18next'
import { DEFAULT_USER, useApp } from '../Hooks/useApp'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

export const Menu = (): React.JSX.Element => {
  const app = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const onLogout = () => {
    app.setAuth({ token: null, user: DEFAULT_USER })
    navigate('/')
  }

  if (!app.auth.token) {
    return <></>
  }

  const [,, id] = location.pathname.split('/')
  const add = !id || id === 'new' ? '' : `/${id}`

  return (
    <AppBar position="static">
      <Toolbar sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 2fr' }}>
        <Button startIcon={<Home />} onClick={() => navigate(`/home${add}`)}><Trans>Dashboard</Trans></Button>
        <Button startIcon={<Rule />} onClick={() => navigate(`/results${add}`)}><Trans>Results</Trans></Button>
        <Button startIcon={<AccountTree />}><Trans>Rules</Trans></Button>
        <Button startIcon={<MiscellaneousServices />}><Trans>Services</Trans></Button>
        <Button startIcon={<Settings />} onClick={() => navigate(`/settings${add}`)}><Trans>Settings</Trans></Button>
        <Box sx={{ textAlign: 'right' }}>
          <Button startIcon={<Logout />} onClick={onLogout}><Trans>Logout</Trans></Button>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
