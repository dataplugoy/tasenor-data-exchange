import { AppBar, Toolbar, Button, Box, IconButton, Menu as MuiMenu, MenuItem, Tooltip, Typography } from '@mui/material'
import { Language, Logout } from '@mui/icons-material'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DEFAULT_PROJECT, DEFAULT_USER, useApp } from '../Hooks/useApp'
import { useLocation, useNavigate } from 'react-router-dom'
import pck from '../../package.json'
import { ledger } from '../theme'

/**
 * Sections of the application in the menu.
 */
const SECTIONS: { code: string, path: string, keepPlan: boolean }[] = [
  { code: 'Dashboard', path: 'home', keepPlan: true },
  { code: 'Executions', path: 'flow-plans', keepPlan: true },
  { code: 'Rules', path: 'rules', keepPlan: true },
  { code: 'Results', path: 'results', keepPlan: true },
  { code: 'Services', path: 'services', keepPlan: false },
  { code: 'Settings', path: 'settings', keepPlan: true },
]

export const Menu = (): React.JSX.Element => {
  const app = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const { t, i18n } = useTranslation()
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

  const labels: Record<string, string> = {
    Dashboard: t('Dashboard'),
    Executions: t('Executions'),
    Rules: t('Rules'),
    Results: t('Results'),
    Services: t('Services'),
    Settings: t('Settings'),
  }

  const [, section, id] = location.pathname.split('/')
  // Only a flow plan ID is carried over to the other pages, not paths like `new` or `questions`.
  const add = id && /^\d+$/.test(id) ? `/${id}` : ''

  return (
    <AppBar position="static" color="inherit" elevation={0} sx={{ backgroundColor: '#FFFFFF', borderBottom: `1px solid ${ledger.rule}` }}>
      <Toolbar sx={{ gap: 4, minHeight: '3.5rem !important' }}>
        <Typography component="div" sx={{ fontWeight: 700, fontSize: '1.15rem', color: 'primary.main', letterSpacing: '-0.02em' }}>
          TaDeX
        </Typography>

        <Box component="nav" sx={{ display: 'flex', gap: 0.5, flex: 1, alignSelf: 'stretch' }}>
          {SECTIONS.map(item => {
            const active = section === item.path
            return (
              <Button
                key={item.code}
                data-cy={`Menu-${item.code}`}
                aria-current={active ? 'page' : undefined}
                onClick={() => navigate(`/${item.path}${item.keepPlan ? add : ''}`)}
                sx={{
                  px: 1.5,
                  borderRadius: 0,
                  color: active ? 'text.primary' : 'text.secondary',
                  borderBottom: '3px solid',
                  borderBottomColor: active ? ledger.coin : 'transparent',
                  borderTop: '3px solid transparent',
                  '&:hover': { backgroundColor: 'transparent', color: 'text.primary' },
                }}
              >
                {labels[item.code]}
              </Button>
            )
          })}
        </Box>

        <Typography variant="body2" sx={{ color: 'text.secondary' }}>v{pck.version}</Typography>
        <Tooltip title={t('Language')}>
          <Button data-cy="Menu-Language" onClick={onOpen} startIcon={<Language fontSize="small"/>} sx={{ color: 'text.secondary', minWidth: 0 }}>
            {i18n.language.toUpperCase()}
          </Button>
        </Tooltip>
        <Tooltip title={t('Logout')}>
          <IconButton data-cy="Menu-Logout" onClick={onLogout} aria-label={t('Logout')} sx={{ color: 'text.secondary', ml: -2 }}>
            <Logout fontSize="small"/>
          </IconButton>
        </Tooltip>
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
          sx={{ width: '8rem' }}
          data-cy="language-selector-EN"
          onClick={() => onSelect('en')}
        >
          English
        </MenuItem>
        <MenuItem
          sx={{ width: '8rem' }}
          data-cy="language-selector-FI"
          onClick={() => onSelect('fi')}
        >
          Suomi
        </MenuItem>
      </MuiMenu>
    </AppBar>
  )
}
