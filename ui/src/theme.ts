import { createTheme } from '@mui/material'

/**
 * Colors of the ledger: pale columnar paper, ink and the Tasenor navy, with the coin yellow of the logo as a marker.
 */
export const ledger = {
  canvas: '#EEF1EC',
  paper: '#FBFCFA',
  rule: '#D3DAD2',
  ruleStrong: '#B9C3BA',
  ink: '#1D2622',
  muted: '#5D6A63',
  navy: '#1F3F8F',
  navyDark: '#152C66',
  navyLight: '#E3E9F6',
  navySoft: '#9FB0D8',
  coin: '#E2C33A',
  debit: '#2E6B4F',
  credit: '#A43C30',
  amber: '#8F6310',
  plum: '#7E3A62',
}

export const fonts = {
  sans: '"Public Sans", system-ui, sans-serif',
  mono: '"IBM Plex Mono", ui-monospace, monospace',
}

export const theme = createTheme({
  palette: {
    mode: 'light',

    primary: {
      light: '#4F6DB5',
      main: ledger.navy,
      dark: ledger.navyDark,
      contrastText: '#FFFFFF'
    },
    secondary: {
      light: '#4F6DB5',
      main: ledger.navy,
      dark: ledger.navyDark,
      contrastText: '#FFFFFF'
    },
    success: {
      main: ledger.debit,
    },
    error: {
      main: ledger.credit,
    },
    warning: {
      main: ledger.amber,
    },
    text: {
      primary: ledger.ink,
      secondary: ledger.muted,
    },
    divider: ledger.rule,
    background: {
      default: ledger.canvas,
      paper: ledger.paper,
    },
  },

  shape: {
    borderRadius: 6,
  },

  typography: {
    fontFamily: fonts.sans,
    fontSize: 14,
    h1: {
      fontWeight: 650,
      fontSize: '1.5rem',
      lineHeight: '2rem',
      letterSpacing: '-0.01em',
    },
    subtitle1: {
      fontWeight: 600,
      fontSize: '1rem',
    },
    body1: {
      fontSize: '0.95rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.45,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: 0,
    },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontVariantNumeric: 'tabular-nums',
        },
        'code, pre': {
          fontFamily: fonts.mono,
        },
      }
    },

    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        outlined: {
          borderColor: ledger.rule,
        },
      }
    },

    MuiCard: {
      defaultProps: {
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          borderColor: ledger.rule,
        }
      }
    },

    MuiCardHeader: {
      styleOverrides: {
        root: {
          paddingBottom: 0,
        },
        avatar: {
          // Card icons are plain navy glyphs instead of filled tiles.
          '& .MuiSvgIcon-root': {
            backgroundColor: 'transparent !important',
            color: `${ledger.navy} !important`,
          },
        },
      }
    },

    MuiAccordion: {
      defaultProps: {
        disableGutters: true,
        elevation: 0,
      },
      styleOverrides: {
        root: {
          border: `1px solid ${ledger.rule}`,
          borderBottomWidth: 0,
          '&:last-of-type': {
            borderBottomWidth: 1,
          },
          '&::before': {
            display: 'none',
          },
          '&.Mui-expanded': {
            backgroundColor: '#FFFFFF',
          },
        }
      }
    },

    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
        outlined: {
          borderColor: ledger.ruleStrong,
        },
      }
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          fontWeight: 500,
        }
      }
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 10,
          border: `1px solid ${ledger.rule}`,
        }
      }
    },

    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontWeight: 650,
        }
      }
    },

    MuiLink: {
      styleOverrides: {
        root: {
          color: ledger.navy,
          textUnderlineOffset: '0.15em',
        }
      }
    },

    MuiFormHelperText: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          lineHeight: '1.3rem',
          color: ledger.muted,
          marginTop: '0.4rem',
          marginBottom: '0.4rem',
          marginLeft: 0
        }
      }
    },

    MuiFormLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.95rem',
          fontWeight: 600,
          lineHeight: '1.2rem',
          color: ledger.ink,
          marginTop: '0.2rem',
          marginBottom: '0.2rem',
        }
      }
    },

    // Labels inside text fields stay quiet; the bold form label is for questions.
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontWeight: 400,
          color: ledger.muted,
          marginTop: 0,
          marginBottom: 0,
          '&.Mui-focused': {
            color: ledger.navy,
          },
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

    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: ledger.rule,
          '&.tx': {
            border: 'none',
            fontSize: '0.9rem',
            padding: '0.15rem 0.4rem',
            color: ledger.ink,
          },
          '&.tx.delivered': {
            color: ledger.debit
          },
          '&.tx.skipped': {
            color: ledger.amber
          },
          '&.tx.pending': {
            color: ledger.credit
          },
          ':first-of-type': {
            paddingLeft: '1rem'
          },
          ':last-child': {
            paddingRight: '1rem'
          },
          '&.tx.heading': {
            fontWeight: 600,
          },
          '&.tx.first': {
            borderTop: `1px solid ${ledger.rule}`,
          },
          '&.tx.extras': {
            fontSize: '0.8rem',
            color: ledger.muted
          },
          '&.tx.debit': {
            color: ledger.debit
          },
          '&.tx.debit.heading': {
            color: 'inherit'
          },
          '&.tx.credit': {
            color: ledger.credit
          },
          '&.tx.credit.heading': {
            color: 'inherit'
          },
        },
        head: {
          fontWeight: 600,
          color: ledger.muted,
          fontSize: '0.8rem',
          backgroundColor: 'transparent',
        },
      }
    },

    // Unified items
    MuiTypography: {
      styleOverrides: {
        root: {
          textDecoration: 'none',
          '&.MuiTypography-h1': {
            marginBottom: '1rem',
          },
          '&.unified.time': {
            fontSize: '1rem',
            fontWeight: 600,
            color: ledger.ink
          },
          '&.unified.value': {
            fontWeight: 600,
            color: ledger.debit
          },
          '&.unified.fee': {
            fontWeight: 600,
            color: ledger.credit
          },
          '&.unified.tax': {
            fontWeight: 600,
            color: ledger.credit
          },
          '&.unified.account': {
            color: ledger.amber
          },
          '&.unified.asset-in': {
            color: ledger.navy
          },
          '&.unified.asset-out': {
            color: ledger.plum
          },
          '&.unified.rates': {
            color: ledger.amber
          },
          '&.unified.text': {
            fontSize: '0.85rem',
            color: ledger.muted
          },
        }
      }
    },
  }
})
