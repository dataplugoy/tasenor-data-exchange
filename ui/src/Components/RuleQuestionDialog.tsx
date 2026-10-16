import React, { useEffect, useState } from 'react'
import { Autocomplete, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, TextField, Typography } from '@mui/material'
import { Add, Delete } from '@mui/icons-material'
import { Trans, useTranslation } from 'react-i18next'
import { RuleQuestion } from '../Types/API/RuleQuestion'
import { RuleQuestionKind } from '../Types/API/RuleQuestionKind'
import { RuleQuestionOption } from '../Types/API/RuleQuestionOption'
import { SaveRuleQuestionRequest } from '../Types/API/projects/SaveRuleQuestionRequest'
import { usePOST, usePUT } from '../Hooks/useNet'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, TAX_CATEGORIES } from '../Helpers/categories'
import { AccountField } from './AccountField'

export const QUESTION_KINDS: RuleQuestionKind[] = ['TAGS', 'ACCOUNT', 'TEXT']

const NAME_PATTERN = /^[a-z][a-zA-Z0-9_]*$/

interface RuleQuestionDialogProps {
  open: boolean
  projectId: number
  // Question to edit, or null for a new question.
  question: RuleQuestion | null
  onClose: () => void
  onSaved: (question: RuleQuestion) => void
}

/**
 * Describe the kind of a question.
 */
export function kindLabel(t: (s: string) => string, kind: RuleQuestionKind): string {
  switch (kind) {
    case 'TAGS':
      return t('Choose tags')
    case 'ACCOUNT':
      return t('Choose account')
    case 'TEXT':
      return t('Write text')
  }
}

/**
 * Check that the question can be saved.
 */
function isComplete(q: SaveRuleQuestionRequest): boolean {
  if (!NAME_PATTERN.test(q.name) || q.label.trim() === '') {
    return false
  }
  const options = q.options || []
  switch (q.kind) {
    case 'TEXT':
      return true
    case 'TAGS':
      return options.length > 0 && options.every(o => o.label.trim() !== '' && (o.tags || []).length > 0)
    case 'ACCOUNT':
      return options.length > 0 && options.every(o => o.label.trim() !== '' && !!o.account)
  }
}

/**
 * Dialog for creating and editing a question of the rules.
 */
export const RuleQuestionDialog = (props: RuleQuestionDialogProps): React.JSX.Element => {
  const { open, projectId, question, onClose, onSaved } = props
  const { t } = useTranslation()
  const POST = usePOST<RuleQuestion>()
  const PUT = usePUT<RuleQuestion>()
  const [name, setName] = useState('')
  const [label, setLabel] = useState('')
  const [kind, setKind] = useState<RuleQuestionKind>('TAGS')
  const [options, setOptions] = useState<RuleQuestionOption[]>([])

  useEffect(() => {
    if (!open) return
    setName(question ? question.name : '')
    setLabel(question ? question.label : '')
    setKind(question ? question.kind : 'TAGS')
    setOptions(question ? question.options : [{ label: '', tags: [] }])
  }, [open, question])

  const request: SaveRuleQuestionRequest = { name, label: label.trim(), kind, options: kind === 'TEXT' ? [] : options.map(o => ({ ...o, label: o.label.trim() })) }

  const setOption = (idx: number, option: RuleQuestionOption) => {
    const next = [...options]
    next[idx] = option
    setOptions(next)
  }

  const onKind = (k: RuleQuestionKind) => {
    setKind(k)
    setOptions(k === 'TEXT' ? [] : options.length ? options.map(o => ({ label: o.label })) : [{ label: '' }])
  }

  const onSave = async () => {
    const saved = question
      ? await PUT(`/projects/${projectId}/questions/${question.id}`, request as unknown as Record<string, unknown>)
      : await POST(`/projects/${projectId}/questions`, request as unknown as Record<string, unknown>)
    if (saved) {
      onSaved(saved)
    }
  }

  return <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
    <DialogTitle>{question ? <Trans>Edit Question</Trans> : <Trans>New Question</Trans>}</DialogTitle>
    <DialogContent>
      <Box sx={{ display: 'flex', gap: 2, mt: 1, mb: 2 }}>
        <TextField
          size="small"
          label={t('Question')}
          placeholder={t('Who does this belong to?')}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          sx={{ flex: 3 }}
          data-cy="QuestionLabel"
        />
        <TextField
          size="small"
          label={t('Name')}
          value={name}
          error={name !== '' && !NAME_PATTERN.test(name)}
          helperText={t('Used in texts as {{example}}', { example: `{?${name || 'name'}}` })}
          onChange={(e) => setName(e.target.value.trim())}
          sx={{ flex: 1 }}
          data-cy="QuestionName"
        />
        <TextField
          select
          size="small"
          label={t('Answer')}
          value={kind}
          onChange={(e) => onKind(e.target.value as RuleQuestionKind)}
          sx={{ flex: 1 }}
          data-cy="QuestionKind"
        >
          {QUESTION_KINDS.map(k => <MenuItem key={k} value={k}>{kindLabel(t, k)}</MenuItem>)}
        </TextField>
      </Box>

      {kind === 'TEXT' && <Typography color="text.secondary">
        <Trans>The answer is written for each line and placed in the text of the transaction.</Trans>
      </Typography>}

      {kind !== 'TEXT' && <>
        <Typography variant="subtitle1" sx={{ mb: 1 }}><Trans>Options</Trans></Typography>
        {options.map((option, idx) => <Box key={idx} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
          <TextField
            size="small"
            label={t('Label')}
            value={option.label}
            onChange={(e) => setOption(idx, { ...option, label: e.target.value })}
            sx={{ flex: 1 }}
            data-cy={`OptionLabel-${idx}`}
          />
          {kind === 'TAGS' && <Autocomplete
            multiple
            freeSolo
            options={[]}
            value={option.tags || []}
            onChange={(_, v) => setOption(idx, { ...option, tags: v as string[] })}
            renderInput={(params) => <TextField {...params} size="small" label={t('Tags')} data-cy={`OptionTags-${idx}`}/>}
            sx={{ flex: 1 }}
          />}
          {kind === 'ACCOUNT' && <AccountField
            categories={[...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES, ...TAX_CATEGORIES]}
            value={option.account || ''}
            onChange={(account) => setOption(idx, { ...option, account })}
            label={t('Category or account number')}
            sx={{ flex: 1 }}
          />}
          <IconButton onClick={() => setOptions(options.filter((_, i) => i !== idx))} title={t('Remove option')}><Delete/></IconButton>
        </Box>)}
        <Button size="small" startIcon={<Add/>} onClick={() => setOptions([...options, kind === 'TAGS' ? { label: '', tags: [] } : { label: '' }])} data-cy="AddOption">
          <Trans>Add option</Trans>
        </Button>
      </>}
    </DialogContent>
    <DialogActions>
      <Button variant="outlined" onClick={onClose}><Trans>Cancel</Trans></Button>
      <Button variant="contained" disabled={!isComplete(request)} onClick={onSave} data-cy="SaveQuestion"><Trans>Save</Trans></Button>
    </DialogActions>
  </Dialog>
}
