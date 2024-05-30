import { createTheme } from '@mui/material'

declare module "@mui/material/styles" {
  interface Palette {
    txExtras: Palette['primary']
  }

  interface PaletteOptions {
    txExtras?: PaletteOptions['primary'];
  }
}

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

    txExtras: {
      main: '#0ff'
    }
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
  },

  components: {
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          fontSize: '1rem',
          lineHeight: '1.2rem',
          color: '#A3A3A3',
          marginTop: '0.5rem',
          marginBottom: '0.4rem',
          marginLeft: 0
        }
      }
    },

    MuiFormLabel: {
      styleOverrides: {
        root: {
          fontSize: '1.1rem',
          lineHeight: '1.2rem',
          color: '#ead140',
          marginTop: '0.2rem',
          marginBottom: '0.2rem',
        }
      }
    },

    MuiFormControlLabel: {
      styleOverrides: {
        root: {
          margin: 0,
          padding: 0,
        }
      }
    },

    MuiRadio: {
      styleOverrides: {
        root: {
          padding: '0.2rem',
        }
      }
    },
  }
})
