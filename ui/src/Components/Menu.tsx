import { AppBar, Toolbar, Button, Box, IconButton, Menu as MuiMenu, MenuItem } from '@mui/material'
import { AccountTree, Home, Language, Logout, MiscellaneousServices, Rule, Settings } from '@mui/icons-material'
import React, { useState } from 'react'
import { Trans } from 'react-i18next'
import { DEFAULT_PROJECT, DEFAULT_USER, useApp } from '../Hooks/useApp'
import { useLocation, useNavigate } from 'react-router-dom'

export const Menu = (): React.JSX.Element => {
  const app = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const onLogout = () => {
    app.setAuth({ token: null, user: DEFAULT_USER })
    app.setProject(DEFAULT_PROJECT)
    navigate('/')
  }
  const onOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const onClose = () => {
    setAnchorEl(null)
  }
  const onSelect = (lang: 'en' | 'fi') => {
    localStorage.setItem('language', lang)
    onClose()
    window.location.reload()
  }

  if (!app.auth.token) {
    return <></>
  }

  const [,, id] = location.pathname.split('/')
  const add = !id || id === 'new' ? '' : `/${id}`

  return (
    <AppBar position="static">
      <Toolbar sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 2fr auto' }}>
        <Button data-cy="Menu-Dashboard" startIcon={<Home />} onClick={() => navigate(`/home${add}`)}><Trans>Dashboard</Trans></Button>
        <Button data-cy="Menu-Results" startIcon={<Rule />} onClick={() => navigate(`/results${add}`)}><Trans>Results</Trans></Button>
        <Button data-cy="Menu-Rules" startIcon={<AccountTree />}><Trans>Rules</Trans></Button>
        <Button data-cy="Menu-Services" startIcon={<MiscellaneousServices />}><Trans>Services</Trans></Button>
        <Button data-cy="Menu-Settings" startIcon={<Settings />} onClick={() => navigate(`/settings${add}`)}><Trans>Settings</Trans></Button>
        <Box sx={{ textAlign: 'right' }}>
          <Button data-cy="Menu-Logout" startIcon={<Logout />} onClick={onLogout}><Trans>Logout</Trans></Button>
        </Box>
        <IconButton data-cy="Menu-Language" onClick={onOpen}><Language sx={{ color: 'primary.main' }}/></IconButton>
      </Toolbar>
      <MuiMenu
        data-cy="language-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={onClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem
          sx={{ width: '5rem', color: '#f0f0f0' }}
          data-cy="language-selector-EN"
          onClick={() => onSelect('en')}
        >
            EN
        </MenuItem>
        <MenuItem
          sx={{ width: '5rem', color: '#f0f0f0' }}
          data-cy="language-selector-FI"
          onClick={() => onSelect('fi')}
        >
            FI
        </MenuItem>
      </MuiMenu>

    </AppBar>
  )
}
