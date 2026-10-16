import React, { useEffect, useState } from 'react'
import { Box, Button, Chip, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { Trans, useTranslation } from 'react-i18next'
import { Question } from '../Types/API/Question'
import { UnifiedItemData } from '../Types/API/UnifiedItemData'
import { MappingResultView } from '../Types/API/MappingResultView'
import { MappingRuleDialog } from './MappingRuleDialog'
import { RuleActionEditor } from './RuleActionEditor'
import { LineInfo, actionFromLine, actionToUnified, conditionsFromLine, counterparty, isActionComplete } from '../Helpers/rules'

interface QuestionUnmatchedPanelProps {
  question: Question
  onChange: (variable: string, value: unknown) => void
}

type Status = 'open' | 'rule' | 'once' | 'skip' | 'manual'

/**
 * Lines no rule matches: create a rule from a line, or handle, skip or leave for manual inspection the line once.
 */
export const QuestionUnmatchedPanel = (props: QuestionUnmatchedPanelProps): React.JSX.Element => {
  const { question, onChange } = props
  const { t } = useTranslation()
  const flowPlanId = question.args?.flowPlanId as number
  const items = (question.args?.items || []) as (LineInfo & { key: string })[]
  const [status, setStatus] = useState<Record<string, Status>>({})
  const [answers, setAnswers] = useState<Record<string, UnifiedItemData>>({})
  const [once, setOnce] = useState<string | null>(null)
  const [action, setAction] = useState<MappingResultView>({ action: 'expense' })
  const [ruleFor, setRuleFor] = useState<(LineInfo & { key: string }) | null>(null)

  useEffect(() => {
    onChange(question.variable, answers)
  }, [answers])

  const answer = (key: string, data: UnifiedItemData | null, newStatus: Status) => {
    const next = { ...answers }
    if (data) {
      next[key] = data
    } else {
      delete next[key]
    }
    setAnswers(next)
    setStatus({ ...status, [key]: newStatus })
  }

  const startOnce = (item: LineInfo & { key: string }) => {
    setAction(actionFromLine(item))
    setOnce(item.key)
  }

  const manualInspection = (item: LineInfo & { key: string }) => {
    const view = actionFromLine(item)
    view.account = view.action === 'income' ? 'INCOME_NEEDS_MANUAL_INSPECTION' : 'EXPENSE_NEEDS_MANUAL_INSPECTION'
    answer(item.key, actionToUnified(view, item), 'manual')
  }

  const describeStatus = (item: LineInfo & { key: string }): React.JSX.Element | null => {
    switch (status[item.key]) {
      case 'rule':
        return <Chip size="small" color="success" label={t('Rule created')}/>
      case 'skip':
        return <Chip size="small" label={t('Skipped once')} onDelete={() => answer(item.key, null, 'open')}/>
      case 'manual':
        return <Chip size="small" color="warning" label={t('Manual inspection')} onDelete={() => answer(item.key, null, 'open')}/>
      case 'once':
        return <Chip size="small" color="info" label={`${t('Handled once')}: ${answers[item.key]?.text || ''}`} onDelete={() => answer(item.key, null, 'open')}/>
    }
    return null
  }

  return <Box>
    <Typography sx={{ mb: 1 }}>{question.help}</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
      <Trans>New rules are applied to the lines when you continue.</Trans>
    </Typography>
    <Table size="small" data-cy="UnmatchedLines">
      <TableHead>
        <TableRow>
          <TableCell><Trans>Date</Trans></TableCell>
          <TableCell align="right"><Trans>Amount</Trans></TableCell>
          <TableCell><Trans>Line</Trans></TableCell>
          <TableCell/>
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map(item => <React.Fragment key={item.key}>
          <TableRow data-cy={`Unmatched-${item.key}`}>
            <TableCell sx={{ whiteSpace: 'nowrap' }}>{item.time}</TableCell>
            <TableCell align="right">{item.total}</TableCell>
            <TableCell>
              <Box>{counterparty(item) || item.text}</Box>
              <Box sx={{ color: 'text.secondary', fontSize: '0.8em' }}>
                {item.text}{item.fields.Viesti ? ` – ${item.fields.Viesti}` : ''}
              </Box>
            </TableCell>
            <TableCell sx={{ whiteSpace: 'nowrap' }} align="right">
              {describeStatus(item)}
              {(!status[item.key] || status[item.key] === 'open') && <>
                <Button size="small" onClick={() => setRuleFor(item)} data-cy="CreateRule"><Trans>Create rule</Trans></Button>
                <Button size="small" onClick={() => startOnce(item)} data-cy="HandleOnce"><Trans>Handle once</Trans></Button>
                <Button size="small" onClick={() => answer(item.key, { type: 'skip' }, 'skip')} data-cy="SkipOnce"><Trans>Skip once</Trans></Button>
                <Button size="small" onClick={() => manualInspection(item)} data-cy="ManualInspection"><Trans>Manual inspection</Trans></Button>
              </>}
            </TableCell>
          </TableRow>
          {once === item.key && <TableRow>
            <TableCell colSpan={4}>
              <RuleActionEditor value={action} onChange={setAction} fieldNames={Object.keys(item.fields)}/>
              <Box sx={{ mt: 1, textAlign: 'right' }}>
                <Button size="small" variant="outlined" onClick={() => setOnce(null)}><Trans>Cancel</Trans></Button>
                <Button size="small" variant="contained" sx={{ ml: 1 }} disabled={!isActionComplete(action)} onClick={() => {
                  answer(item.key, actionToUnified(action, item), 'once')
                  setOnce(null)
                }} data-cy="UseOnce"><Trans>Use for this line</Trans></Button>
              </Box>
            </TableCell>
          </TableRow>}
        </React.Fragment>)}
      </TableBody>
    </Table>

    <MappingRuleDialog
      open={ruleFor !== null}
      flowPlanId={flowPlanId}
      rule={null}
      initialFilter={ruleFor ? conditionsFromLine(ruleFor) : undefined}
      initialResult={ruleFor ? actionFromLine(ruleFor) : undefined}
      onClose={() => setRuleFor(null)}
      onSaved={() => {
        if (ruleFor) {
          answer(ruleFor.key, null, 'rule')
        }
        setRuleFor(null)
      }}
    />
  </Box>
}
