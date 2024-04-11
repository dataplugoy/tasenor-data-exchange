import { createTheme } from '@mui/material'

export const theme = createTheme({
  palette: {
    mode: 'dark',

    // Yellow
    primary: {
      main: '#ead140',
      contrastText: '#000'
    },
    // Blue
    secondary: {
      main: '#0149ab',
      contrastText: '#FFF'
    },

    background: {
      default: '#111',
      paper: '#222',
    },
  },

  typography: {
    h1: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: '1.5rem',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
    },
  }
})
