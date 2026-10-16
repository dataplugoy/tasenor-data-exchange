import React, { useState } from 'react'
import { Box, Button, IconButton, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { Add, Clear, Delete, Edit } from '@mui/icons-material'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../Hooks/useApp'
import { useDELETE } from '../Hooks/useNet'
import { useRuleQuestions } from '../Hooks/useRuleQuestions'
import { RuleQuestion } from '../Types/API/RuleQuestion'
import { RuleQuestionDialog, kindLabel } from '../Components/RuleQuestionDialog'
import { Confirm } from '../Components/Confirm'
import { accountLabel } from '../Helpers/rules'

/**
 * Questions of the project asked by the rules for each line.
 */
export const RuleQuestionsPage = (): React.JSX.Element => {
  const app = useApp()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const DELETE = useDELETE()
  const projectId = app.project.id as number
  const [questions, load] = useRuleQuestions(projectId)
  const [editing, setEditing] = useState<RuleQuestion | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<RuleQuestion | null>(null)

  const onDelete = async () => {
    if (deleting && await DELETE(`/projects/${projectId}/questions/${deleting.id}`)) {
      load()
    }
    setDeleting(null)
  }

  const describeOptions = (q: RuleQuestion): string => q.options.map(o => q.kind === 'TAGS'
    ? `${o.label} ${(o.tags || []).map(tag => `[${tag}]`).join('')}`
    : `${o.label} (${accountLabel(t, o.account)})`).join(', ')

  return <Box sx={{ pb: 8 }}>
    <Typography variant="h1" sx={{ display: 'inline-block' }}>
      <IconButton sx={{ mt: -0.8 }} onClick={() => navigate(-1)}><Clear/></IconButton> <Trans>Questions of the Rules</Trans>
    </Typography>
    <Typography sx={{ my: 1 }} color="text.secondary">
      <Trans>Rules can ask these questions for each line they match. The questions are shared by all rules of the project.</Trans>
    </Typography>

    <Box sx={{ my: 2 }}>
      <Button variant="contained" startIcon={<Add/>} onClick={() => setCreating(true)} data-cy="NewQuestion"><Trans>New Question</Trans></Button>
    </Box>

    <Table size="small" data-cy="QuestionTable">
      <TableHead>
        <TableRow>
          <TableCell><Trans>Question</Trans></TableCell>
          <TableCell><Trans>Answer</Trans></TableCell>
          <TableCell><Trans>Options</Trans></TableCell>
          <TableCell><Trans>Used by</Trans></TableCell>
          <TableCell width="8%"/>
        </TableRow>
      </TableHead>
      <TableBody>
        {questions.length === 0 && <TableRow>
          <TableCell colSpan={5}><Trans>There are no questions yet.</Trans></TableCell>
        </TableRow>}
        {questions.map(q => <TableRow key={q.id} data-cy={`Question-${q.name}`}>
          <TableCell>
            <Box>{q.label}</Box>
            <Box sx={{ color: 'text.secondary', fontSize: '0.85em' }}>{q.name}</Box>
          </TableCell>
          <TableCell>{kindLabel(t, q.kind)}</TableCell>
          <TableCell sx={{ fontSize: '0.85em' }}>{describeOptions(q)}</TableCell>
          <TableCell sx={{ fontSize: '0.85em' }}>{(q.usedBy || []).join(', ')}</TableCell>
          <TableCell sx={{ whiteSpace: 'nowrap' }}>
            <IconButton size="small" title={t('Edit')} onClick={() => setEditing(q)}><Edit fontSize="small"/></IconButton>
            <IconButton size="small" title={t('Delete')} disabled={(q.usedBy || []).length > 0} onClick={() => setDeleting(q)}><Delete fontSize="small"/></IconButton>
          </TableCell>
        </TableRow>)}
      </TableBody>
    </Table>

    <RuleQuestionDialog
      open={creating || editing !== null}
      projectId={projectId}
      question={editing}
      onClose={() => { setCreating(false); setEditing(null) }}
      onSaved={() => { setCreating(false); setEditing(null); load() }}
    />

    <Confirm
      open={deleting !== null}
      title={t('Delete Question')}
      areYouSure
      onClose={() => setDeleting(null)}
      onSubmit={onDelete}
    >
      {deleting && t('Delete the question {{label}}?', { label: deleting.label })}
    </Confirm>
  </Box>
}
