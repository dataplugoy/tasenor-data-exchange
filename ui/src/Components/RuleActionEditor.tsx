import React, { useEffect, useState } from 'react'
import { Autocomplete, Box, Link, MenuItem, Popover, TextField, Typography } from '@mui/material'
import { Trans, useTranslation } from 'react-i18next'
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

// Maximum number of distinct values listed for a field.
const MAX_VALUES = 50

interface FieldNamesProps {
  names: string[]
  // Fields of the lines matching the rule, or null if not known.
  matches: Record<string, unknown>[] | null
}

/**
 * List of field names. Clicking a name shows the values the field has in the matching lines.
 */
const FieldNames = (props: FieldNamesProps): React.JSX.Element => {
  const { names, matches } = props
  const { t } = useTranslation()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [field, setField] = useState('')

  const counts = new Map<string, number>()
  for (const fields of matches || []) {
    const value = fields[field]
    const text = value === null || value === undefined ? '' : `${value}`
    counts.set(text, (counts.get(text) || 0) + 1)
  }
  // Most common values first.
  const values = [...counts.entries()].sort((a, b) => b[1] - a[1])

  return <>
    {t('Fields can be used like {{example}}. Available:', { example: '{Viesti}' })}{' '}
    {names.map((name, idx) => <React.Fragment key={name}>
      {idx > 0 && ', '}
      <Link component="button" type="button" sx={{ verticalAlign: 'baseline', fontSize: 'inherit' }} onClick={(e) => { setField(name); setAnchor(e.currentTarget) }} data-cy={`FieldValues-${name}`}>{name}</Link>
    </React.Fragment>)}
    <Popover open={anchor !== null} anchorEl={anchor} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
      <Box sx={{ p: 2, maxWidth: 600, maxHeight: 400 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>{t('Values of {{field}} in the matching lines', { field })}</Typography>
        {values.length === 0 && <Typography variant="body2" color="text.secondary"><Trans>No matching lines in the preview.</Trans></Typography>}
        {values.slice(0, MAX_VALUES).map(([value, count]) => <Box key={value} sx={{ display: 'flex', gap: 2, fontSize: '0.85em', py: 0.25, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ flex: 1, whiteSpace: 'pre-wrap', fontFamily: 'monospace', color: value === '' ? 'text.secondary' : undefined }}>{value === '' ? t('(empty)') : value}</Box>
          <Box sx={{ color: 'text.secondary' }}>{count}</Box>
        </Box>)}
        {values.length > MAX_VALUES && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{t('Showing first {{shown}}.', { shown: MAX_VALUES })}</Typography>}
      </Box>
    </Popover>
  </>
}

interface RuleActionEditorProps {
  value: MappingResultView
  onChange: (value: MappingResultView) => void
  // Field names offered for the text template.
  fieldNames?: string[]
  // Fields of the lines matching the rule, or null if not known.
  matches?: Record<string, unknown>[] | null
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
  const { value, onChange, fieldNames, matches } = props
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
        helperText={fieldNames && fieldNames.length ? <FieldNames names={fieldNames} matches={matches || null}/> : undefined}
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
