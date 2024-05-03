import { createTheme } from '@mui/material'

export const theme = createTheme({
  palette: {
    mode: 'dark',

    // Yellow
    primary: {
      light: '#fceb87',
      main: '#ead140',
      dark: '#ae9b2c',
      contrastText: '#000'
    },
    // Blue
    secondary: {
      light: '#73a4e8',
      main: '#0149ab',
      dark: '#103f7e',
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
    body2: {
      fontFamily: 'monospace'
    }
  }
})
