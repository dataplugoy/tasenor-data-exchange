import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Alert, Box, Chip, CircularProgress, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { Trans, useTranslation } from 'react-i18next'
import { useApp } from '../Hooks/useApp'
import { SaveRuleRequest } from '../Types/API/flow-plans/SaveRuleRequest'
import { RulePreviewResponse } from '../Types/API/flow-plans/RulePreviewResponse'
import { accountLabel, counterparty } from '../Helpers/rules'

interface RulePreviewProps {
  flowPlanId: number
  rule: SaveRuleRequest | null
  ruleId?: number | null
}

/**
 * Show recent lines matching the rule being edited and the transactions they produce.
 */
export const RulePreview = (props: RulePreviewProps): React.JSX.Element => {
  const { flowPlanId, rule, ruleId } = props
  const app = useApp()
  const { t } = useTranslation()
  const [preview, setPreview] = useState<RulePreviewResponse | null>(null)
  const [problem, setProblem] = useState('')
  const [loading, setLoading] = useState(false)
  const json = JSON.stringify(rule)

  useEffect(() => {
    if (!rule) {
      setPreview(null)
      return
    }
    let cancelled = false
    const timer = setTimeout(() => {
      setLoading(true)
      // Errors are expected while editing, so they are shown here instead of the global messages.
      axios.post<RulePreviewResponse>(`/api/v1/flow-plans/${flowPlanId}/rules/preview${ruleId ? `?ruleId=${ruleId}` : ''}`, rule, {
        headers: app.auth.token ? { Authorization: `Bearer ${app.auth.token}` } : {}
      }).then(res => {
        if (!cancelled) {
          setPreview(res.data)
          setProblem('')
        }
      }).catch(err => {
        if (!cancelled) {
          setPreview(null)
          setProblem(err.response?.data?.message ? t(err.response.data.message) : t('The rule is not complete yet.'))
        }
      }).finally(() => !cancelled && setLoading(false))
    }, 500)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [json, flowPlanId, ruleId])

  if (!rule) {
    return <Typography color="text.secondary"><Trans>Complete the action to see matching lines.</Trans></Typography>
  }
  if (problem) {
    return <Alert severity="info">{problem}</Alert>
  }
  if (!preview) {
    return <CircularProgress size={24}/>
  }

  const shadowed = preview.matches.filter(m => m.shadowedBy).length

  return <Box>
    <Typography variant="body2" sx={{ mb: 1 }}>
      {t('{{count}} of {{checked}} recent lines match.', { count: preview.count, checked: preview.checked })}
      {preview.count > preview.matches.length && ` ${t('Showing first {{shown}}.', { shown: preview.matches.length })}`}
      {loading && <CircularProgress size={14} sx={{ ml: 1 }}/>}
    </Typography>
    {shadowed > 0 && <Alert severity="warning" sx={{ mb: 1 }}>
      {t('{{count}} of these lines are taken by earlier rules and this rule is not used for them.', { count: shadowed })}
    </Alert>}
    {preview.checked === 0 && <Alert severity="info"><Trans>There are no imported lines yet. Upload a statement to see a preview.</Trans></Alert>}
    {preview.matches.length > 0 && <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell><Trans>Date</Trans></TableCell>
          <TableCell align="right"><Trans>Amount</Trans></TableCell>
          <TableCell><Trans>Line</Trans></TableCell>
          <TableCell><Trans>Result</Trans></TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {preview.matches.map((match, idx) => <TableRow key={idx} sx={{ opacity: match.shadowedBy ? 0.5 : 1 }}>
          <TableCell sx={{ whiteSpace: 'nowrap' }}>{match.time}</TableCell>
          <TableCell align="right">{match.total}</TableCell>
          <TableCell>
            <Box>{counterparty(match) || match.text}</Box>
            <Box sx={{ color: 'text.secondary', fontSize: '0.8em' }}>{match.text}</Box>
          </TableCell>
          <TableCell>
            {match.shadowedBy && <Chip size="small" color="warning" label={t('Taken by rule {{name}}', { name: match.shadowedBy })} sx={{ mb: 0.5 }}/>}
            {match.result?.type === 'skip' && <Trans>Skipped</Trans>}
            {match.lines && match.lines.map((line, i) => <Box key={i} sx={{ display: 'flex', gap: 1, fontSize: '0.85em' }}>
              <Box sx={{ flex: 1 }}>{accountLabel(t, line.account)}</Box>
              <Box sx={{ width: '6em', textAlign: 'right' }}>{parseFloat(line.amount) >= 0 ? parseFloat(line.amount).toFixed(2) : ''}</Box>
              <Box sx={{ width: '6em', textAlign: 'right' }}>{parseFloat(line.amount) < 0 ? (-parseFloat(line.amount)).toFixed(2) : ''}</Box>
            </Box>)}
            {match.lines && match.lines[0] && <Box sx={{ color: 'text.secondary', fontSize: '0.8em' }}>{match.lines[0].text}</Box>}
            {match.note && <Box sx={{ color: 'warning.main', fontSize: '0.85em' }}>{match.note}</Box>}
          </TableCell>
        </TableRow>)}
      </TableBody>
    </Table>}
  </Box>
}
