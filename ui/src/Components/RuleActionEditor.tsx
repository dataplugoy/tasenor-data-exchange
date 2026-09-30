import React, { useEffect, useState } from 'react'
import { Autocomplete, Box, MenuItem, TextField } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { MappingResultView } from '../Types/API/MappingResultView'
import { ACTIONS, DEFAULT_TEXT, accountLabel, actionLabel } from '../Helpers/rules'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, TAX_CATEGORIES } from '../Helpers/categories'

interface VatFieldProps {
  rate: number | null
  onChange: (rate: number | null) => void
}

/**
 * VAT percentage input keeping the text as typed, so that decimals like 25,5 can be entered.
 */
const VatField = (props: VatFieldProps): React.JSX.Element => {
  const { rate, onChange } = props
  const { t } = useTranslation()
  const [text, setText] = useState(rate ? `${rate}` : '')

  const parse = (s: string): number | null => {
    const n = parseFloat(s.replace(',', '.'))
    return isNaN(n) || n === 0 ? null : n
  }

  // Follow changes from outside, like opening another rule.
  useEffect(() => {
    if (parse(text) !== rate) {
      setText(rate ? `${rate}` : '')
    }
  }, [rate])

  return <TextField
    size="small"
    label={t('VAT %')}
    value={text}
    slotProps={{ htmlInput: { inputMode: 'decimal' } }}
    onChange={(e) => {
      const s = e.target.value.replace(/[^0-9.,]/g, '')
      setText(s)
      onChange(parse(s))
    }}
    sx={{ flex: 0.5 }}
    data-cy="VatRate"
  />
}

interface RuleActionEditorProps {
  value: MappingResultView
  onChange: (value: MappingResultView) => void
  // Field names offered for the text template.
  fieldNames?: string[]
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

export const RuleActionEditor = (props: RuleActionEditorProps): React.JSX.Element => {
  const { value, onChange, fieldNames } = props
  const { t } = useTranslation()
  const { action } = value

  const categories = action === 'income' ? INCOME_CATEGORIES : action === 'tax' ? TAX_CATEGORIES : [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]
  const needsAccount = ['expense', 'income', 'tax'].includes(action)
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

  return <Box>
    <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
      <TextField
        select
        size="small"
        label={t('Action')}
        value={action}
        onChange={(e) => onChange({ ...value, action: e.target.value as MappingResultView['action'] })}
        sx={{ flex: 1 }}
      >
        {ACTIONS.map(a => <MenuItem key={a} value={a}>{actionLabel(t, a)}</MenuItem>)}
      </TextField>

      {needsAccount && <Autocomplete
        freeSolo
        autoSelect
        options={categories}
        getOptionLabel={optionLabel}
        value={value.account || ''}
        onChange={(_, v) => onChange({ ...value, account: v ? resolveAccount(v) : '' })}
        renderInput={(params) => <TextField {...params} size="small" label={t('Category or account number')}/>}
        sx={{ flex: 2 }}
      />}

      {action === 'transfer' && <TextField
        size="small"
        label={t('Service')}
        placeholder="Nordnet"
        value={value.service || ''}
        onChange={(e) => onChange({ ...value, service: e.target.value })}
        sx={{ flex: 2 }}
      />}
    </Box>

    {action !== 'skip' && <>
      <TextField
        fullWidth
        size="small"
        label={t('Text')}
        helperText={fieldNames && fieldNames.length ? t('Fields can be used like {{example}}. Available: {{fields}}', { example: '{Viesti}', fields: fieldNames.join(', ') }) : undefined}
        value={value.text ?? DEFAULT_TEXT}
        onChange={(e) => onChange({ ...value, text: e.target.value })}
        sx={{ mb: 1.5 }}
      />

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Autocomplete
          multiple
          freeSolo
          options={[]}
          value={value.tags || []}
          onChange={(_, v) => onChange({ ...value, tags: v as string[] })}
          renderInput={(params) => <TextField {...params} size="small" label={t('Tags')}/>}
          sx={{ flex: 2 }}
        />
        {(action === 'expense' || action === 'income') && <VatField
          rate={value.vat && value.vat.mode === 'rate' && value.vat.rate ? value.vat.rate : null}
          onChange={(rate) => onChange({ ...value, vat: rate === null ? { mode: 'none' } : { mode: 'rate', rate } })}
        />}
      </Box>
    </>}
  </Box>
}
