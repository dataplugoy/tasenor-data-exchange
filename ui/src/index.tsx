import i18next from 'i18next'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import { AppProvider } from './Hooks/useApp'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { theme } from './theme'
import { I18nextProvider } from 'react-i18next'
import en from './i18n/en.json'
import fi from './i18n/fi.json'

i18next.init({
  resources: {
    en: {
      translations: en
    },
    fi: {
      translations: fi
    },
  },

  fallbackLng: 'en',
  debug: false,

  ns: ['translations'],
  defaultNS: 'translations',

  keySeparator: false,
  nsSeparator: 'NS_NOT_IN_USE',

  interpolation: {
    escapeValue: false,
    formatSeparator: ','
  },

  react: {
    useSuspense: true
  }
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <I18nextProvider i18n={ i18next }>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppProvider>
        <App />
      </AppProvider>
    </ThemeProvider>
  </I18nextProvider>
)
