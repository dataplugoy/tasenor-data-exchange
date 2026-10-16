import React from 'react'
import { Autocomplete, SxProps, TextField, Theme } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { accountLabel } from '../Helpers/rules'

interface AccountFieldProps {
  value: string
  onChange: (code: string) => void
  // Category codes offered.
  categories: string[]
  label: string
  sx?: SxProps<Theme>
}

/**
 * Convert typed account to a code. Plain numbers are direct account numbers.
 */
function toAccountCode(text: string): string {
  const s = text.trim()
  if (/^\d+$/.test(s)) {
    return `ACCOUNT_${s}`
  }
  return s.toUpperCase().replace(/[^A-Z0-9_]/g, '_')
}

/**
 * Selection of a category or a direct account number.
 */
export const AccountField = (props: AccountFieldProps): React.JSX.Element => {
  const { value, onChange, categories, label, sx } = props
  const { t } = useTranslation()

  const optionLabel = (code: string) => code ? `${accountLabel(t, code)}${/^ACCOUNT_/.test(code) ? '' : ` (${code})`}` : ''

  // Committed text may be a code, a label of an option or an account number typed by the user.
  const resolveAccount = (text: string): string => {
    const code = /\(([A-Z0-9_]+)\)$/.exec(text)
    if (code) {
      return code[1]
    }
    const option = categories.find(c => c === text || optionLabel(c) === text || accountLabel(t, c) === text)
    if (option) {
      return option
    }
    if (/^ACCOUNT_\d+$/.test(text)) {
      return text
    }
    return toAccountCode(text)
  }

  return <Autocomplete
    freeSolo
    autoSelect
    options={categories}
    getOptionLabel={optionLabel}
    value={value}
    onChange={(_, v) => onChange(v ? resolveAccount(v) : '')}
    renderInput={(params) => <TextField {...params} size="small" label={label}/>}
    sx={sx}
  />
}
