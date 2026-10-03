import React, { useEffect, useState } from 'react'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel, Switch, TextField, Typography } from '@mui/material'
import { Trans, useTranslation } from 'react-i18next'
import { MappingFilterView } from '../Types/API/MappingFilterView'
import { MappingResultView } from '../Types/API/MappingResultView'
import { SaveRuleRequest } from '../Types/API/flow-plans/SaveRuleRequest'
import { RuleFieldsResponse } from '../Types/API/flow-plans/RuleFieldsResponse'
import { RulePreviewResponse } from '../Types/API/flow-plans/RulePreviewResponse'
import { Rule } from '../Types/API/Rule'
import { useGET, usePOST, usePUT } from '../Hooks/useNet'
import { RuleConditionsEditor } from './RuleConditionsEditor'
import { RuleActionEditor } from './RuleActionEditor'
import { RulePreview } from './RulePreview'
import { DEFAULT_TEXT, cleanAction, isActionComplete, suggestName } from '../Helpers/rules'

interface MappingRuleDialogProps {
  open: boolean
  flowPlanId: number
  // Rule to edit, or null for a new rule.
  rule: Rule | null
  // Initial values for a new rule.
  initialFilter?: MappingFilterView
  initialResult?: MappingResultView
  onClose: () => void
  onSaved: (rule: Rule) => void
}

/**
 * Dialog for creating and editing a mapping rule with a live preview.
 */
export const MappingRuleDialog = (props: MappingRuleDialogProps): React.JSX.Element => {
  const { open, flowPlanId, rule, initialFilter, initialResult, onClose, onSaved } = props
  const { t } = useTranslation()
  const GET = useGET<RuleFieldsResponse>()
  const POST = usePOST<Rule>()
  const PUT = usePUT<Rule>()
  const [fields, setFields] = useState<RuleFieldsResponse>([])
  const [name, setName] = useState('')
  const [nameEdited, setNameEdited] = useState(false)
  const [notes, setNotes] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [filter, setFilter] = useState<MappingFilterView>({ conditions: [] })
  const [result, setResult] = useState<MappingResultView>({ action: 'expense', text: DEFAULT_TEXT })
  const [preview, setPreview] = useState<RulePreviewResponse | null>(null)

  useEffect(() => {
    if (!open) return
    GET(`/flow-plans/${flowPlanId}/rules/fields`).then(res => res && setFields(res))
    if (rule) {
      setName(rule.name)
      setNameEdited(true)
      setNotes(rule.notes || '')
      setEnabled(rule.enabled !== false)
      setFilter((rule.filterView as unknown as MappingFilterView)?.conditions ? rule.filterView as unknown as MappingFilterView : { conditions: [] })
      setResult((rule.resultView as unknown as MappingResultView)?.action ? rule.resultView as unknown as MappingResultView : { action: 'expense', text: DEFAULT_TEXT })
    } else {
      const f = initialFilter || { conditions: [] }
      setFilter(f)
      setResult(initialResult || { action: 'expense', text: DEFAULT_TEXT })
      setName(suggestName(t, f))
      setNameEdited(false)
      setNotes('')
      setEnabled(true)
    }
  }, [open, rule])

  const onFilterChange = (f: MappingFilterView) => {
    setFilter(f)
    if (!nameEdited) {
      setName(suggestName(t, f))
    }
  }

  const complete = isActionComplete(result) && name.trim() !== ''
  const request: SaveRuleRequest | null = isActionComplete(result)
    ? { name: name.trim() || 'Preview', kind: 'MAPPING', filterView: filter, resultView: cleanAction(result), enabled, notes }
    : null

  const onSave = async () => {
    if (!request) return
    const saved = rule
      ? await PUT(`/flow-plans/${flowPlanId}/rules/${rule.id}`, request as unknown as Record<string, unknown>)
      : await POST(`/flow-plans/${flowPlanId}/rules`, request as unknown as Record<string, unknown>)
    if (saved) {
      onSaved(saved)
    }
  }

  return <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
    <DialogTitle>{rule ? <Trans>Edit Rule</Trans> : <Trans>New Rule</Trans>}</DialogTitle>
    <DialogContent>
      <Box sx={{ display: 'flex', gap: 2, mt: 1, mb: 2, alignItems: 'center' }}>
        <TextField
          size="small"
          label={t('Name')}
          value={name}
          onChange={(e) => { setName(e.target.value); setNameEdited(true) }}
          sx={{ flex: 2 }}
          data-cy="RuleName"
        />
        <FormControlLabel control={<Switch checked={enabled} onChange={(e) => setEnabled(e.target.checked)}/>} label={t('Enabled')}/>
      </Box>

      <Typography variant="subtitle1" sx={{ mb: 1 }}><Trans>When a line matches all conditions</Trans></Typography>
      <RuleConditionsEditor value={filter} fields={fields} onChange={onFilterChange}/>

      <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}><Trans>Then</Trans></Typography>
      <RuleActionEditor value={result} onChange={setResult} fieldNames={fields.map(f => f.name)} matches={preview ? preview.matches.map(m => m.fields) : null}/>

      <TextField
        fullWidth
        multiline
        size="small"
        label={t('Notes')}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        sx={{ mt: 2 }}
      />

      <Divider sx={{ my: 2 }}/>
      <Typography variant="subtitle1" sx={{ mb: 1 }}><Trans>Preview</Trans></Typography>
      <RulePreview flowPlanId={flowPlanId} rule={request} ruleId={rule ? rule.id : null} onPreview={setPreview}/>
    </DialogContent>
    <DialogActions>
      <Button variant="outlined" onClick={onClose}><Trans>Cancel</Trans></Button>
      <Button variant="contained" disabled={!complete} onClick={onSave} data-cy="SaveRule"><Trans>Save</Trans></Button>
    </DialogActions>
  </Dialog>
}
