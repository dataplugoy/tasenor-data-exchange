import React from 'react'
import { Autocomplete, Box, Button, IconButton, MenuItem, TextField } from '@mui/material'
import { Add, Delete } from '@mui/icons-material'
import { Trans, useTranslation } from 'react-i18next'
import { MappingCondition } from '../Types/API/MappingCondition'
import { MappingFilterView } from '../Types/API/MappingFilterView'
import { RuleFieldsResponse } from '../Types/API/flow-plans/RuleFieldsResponse'
import { AMOUNT_OPERATORS, TEXT_OPERATORS, operatorLabel, usesField } from '../Helpers/rules'

interface RuleConditionsEditorProps {
  value: MappingFilterView
  fields: RuleFieldsResponse
  onChange: (value: MappingFilterView) => void
}

interface ConditionEditorProps {
  condition: MappingCondition
  fields: RuleFieldsResponse
  onChange: (condition: MappingCondition) => void
  onDelete: () => void
}

const ConditionEditor = (props: ConditionEditorProps): React.JSX.Element => {
  const { condition, fields, onChange, onDelete } = props
  const { t } = useTranslation()
  const { field, operator, value } = condition
  const examples = fields.find(f => f.name === field)?.examples || []

  const setOperator = (op: MappingCondition['operator']) => {
    const next: MappingCondition = { field: usesField(op) ? field : '', operator: op }
    if (op === 'oneOf') {
      next.value = typeof value === 'string' && value ? [value] : []
    } else if (op === 'between') {
      next.value = [0, 0]
    } else if (op === 'amountEquals') {
      next.value = 0
    } else if (usesField(op)) {
      next.value = typeof value === 'string' ? value : ''
    }
    onChange(next)
  }

  let valueEditor: React.JSX.Element | null = null
  switch (operator) {
    case 'equals':
    case 'contains':
    case 'regex':
      valueEditor = <Autocomplete
        freeSolo
        options={examples}
        value={`${value ?? ''}`}
        onInputChange={(_, v) => onChange({ ...condition, value: v })}
        renderInput={(params) => <TextField {...params} label={t('Value')} size="small"/>}
        sx={{ flex: 2 }}
      />
      break
    case 'oneOf':
      valueEditor = <Autocomplete
        multiple
        freeSolo
        options={examples}
        value={value instanceof Array ? value.map(v => `${v}`) : []}
        onChange={(_, v) => onChange({ ...condition, value: v as string[] })}
        renderInput={(params) => <TextField {...params} label={t('Values')} size="small"/>}
        sx={{ flex: 2 }}
      />
      break
    case 'amountEquals':
      valueEditor = <TextField
        label={t('Amount')}
        size="small"
        value={value ?? ''}
        onChange={(e) => onChange({ ...condition, value: e.target.value })}
        sx={{ flex: 2 }}
      />
      break
    case 'between': {
      const [a, b] = value instanceof Array ? value : [0, 0]
      valueEditor = <Box sx={{ flex: 2, display: 'flex', gap: 1 }}>
        <TextField label={t('From')} size="small" value={a} onChange={(e) => onChange({ ...condition, value: [e.target.value, b] })}/>
        <TextField label={t('To')} size="small" value={b} onChange={(e) => onChange({ ...condition, value: [a, e.target.value] })}/>
      </Box>
    }
  }

  return <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
    {usesField(operator) && <Autocomplete
      freeSolo
      options={fields.map(f => f.name)}
      value={field}
      onInputChange={(_, v) => onChange({ ...condition, field: v })}
      renderInput={(params) => <TextField {...params} label={t('Field')} size="small"/>}
      sx={{ flex: 1.5 }}
    />}
    <TextField
      select
      size="small"
      label={t('Condition')}
      value={operator}
      onChange={(e) => setOperator(e.target.value as MappingCondition['operator'])}
      sx={{ flex: 1.2 }}
    >
      {[...TEXT_OPERATORS, ...AMOUNT_OPERATORS].map(op => <MenuItem key={op} value={op}>{operatorLabel(t, op)}</MenuItem>)}
    </TextField>
    {valueEditor}
    {!valueEditor && <Box sx={{ flex: 2 }}/>}
    <IconButton onClick={onDelete} title={t('Remove condition')}><Delete/></IconButton>
  </Box>
}

export const RuleConditionsEditor = (props: RuleConditionsEditorProps): React.JSX.Element => {
  const { value, fields, onChange } = props
  const conditions = value.conditions || []

  const update = (idx: number, condition: MappingCondition) => {
    const next = [...conditions]
    next[idx] = condition
    onChange({ conditions: next })
  }

  const remove = (idx: number) => {
    onChange({ conditions: conditions.filter((_, i) => i !== idx) })
  }

  const add = () => {
    onChange({ conditions: [...conditions, { field: fields[0]?.name || '', operator: 'equals', value: '' }] })
  }

  return <Box>
    {conditions.length === 0 && <Box sx={{ mb: 1, color: 'text.secondary' }}><Trans>No conditions: the rule matches all lines.</Trans></Box>}
    {conditions.map((condition, idx) => <ConditionEditor
      key={idx}
      condition={condition}
      fields={fields}
      onChange={(c) => update(idx, c)}
      onDelete={() => remove(idx)}
    />)}
    <Button size="small" startIcon={<Add/>} onClick={add}><Trans>Add condition</Trans></Button>
  </Box>
}
