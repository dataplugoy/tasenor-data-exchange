import React, { useEffect, useState } from 'react'
import { Box, Button, Chip, IconButton, Link, Switch, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from '@mui/material'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { Add, ArrowDownward, ArrowUpward, Clear, ContentCopy, Delete, Edit } from '@mui/icons-material'
import { useDELETE, useGET, usePATCH, usePOST, usePUT } from '../Hooks/useNet'
import { FlowPlanRulesResponse } from '../Types/API/flow-plans/FlowPlanRulesResponse'
import { Rule } from '../Types/API/Rule'
import { MappingFilterView } from '../Types/API/MappingFilterView'
import { MappingResultView } from '../Types/API/MappingResultView'
import { MappingRuleDialog } from '../Components/MappingRuleDialog'
import { Confirm } from '../Components/Confirm'
import { RuleMatchesDialog } from '../Components/RuleMatchesDialog'
import { describeAction, describeConditions } from '../Helpers/rules'
import { useApp } from '../Hooks/useApp'
import { useRuleQuestions } from '../Hooks/useRuleQuestions'
import { FileUploadData, FileUploader } from '../Components/FileUploader'
import { error } from '@tasenor/common'
import { DateTime } from 'luxon'
import i18next from 'i18next'
import { RulesVersionResponse } from '../Types/API/flow-plans/RulesVersionResponse'

import { RulesFile, QuestionChanges, makeRulesFile, parseRulesFile, questionChanges, remapQuestions } from '../Helpers/rulesFile'
import { RuleQuestionsResponse } from '../Types/API/projects/RuleQuestionsResponse'
import { RuleQuestion } from '../Types/API/RuleQuestion'
import { fonts } from '../theme'

/**
 * List of the rules of a flow plan in the order of evaluation.
 */
export const EditRulesPage = (): React.JSX.Element => {
  const params = useParams()
  const flowPlanId = parseInt(params.id || '0')
  const navigate = useNavigate()
  const { t } = useTranslation()
  const GET = useGET<FlowPlanRulesResponse>()
  const GETVersion = useGET<RulesVersionResponse>()
  const GETQuestions = useGET<RuleQuestionsResponse>()
  const POSTQuestion = usePOST<RuleQuestion>()
  const PUT = usePUT()
  const PATCH = usePATCH()
  const DELETE = useDELETE()
  const [rules, setRules] = useState<Rule[]>([])
  const [editing, setEditing] = useState<Rule | null>(null)
  const [creating, setCreating] = useState<{ filter?: MappingFilterView, result?: MappingResultView } | null>(null)
  const [deleting, setDeleting] = useState<Rule | null>(null)
  const [showingMatches, setShowingMatches] = useState<Rule | null>(null)
  const [upload, setUpload] = useState(false)
  const [uploaded, setUploaded] = useState<{ file: RulesFile, current: RulesVersionResponse, changes: QuestionChanges } | null>(null)
  const app = useApp()
  const [questions, loadQuestions] = useRuleQuestions(app.project.id)

  const load = () => {
    GET(`/flow-plans/${flowPlanId}/rules`).then(res => res && setRules(res as Rule[]))
  }

  useEffect(load, [flowPlanId])

  const save = async (rule: Rule, changes: Partial<Rule>) => {
    const { name, kind, filter, key, result, filterView, resultView, enabled, notes } = { ...rule, ...changes }
    const body = kind === 'MAPPING'
      ? { name, kind, filterView, resultView, enabled, notes }
      : { name, kind: 'ADVANCED', filter, key, result, enabled, notes }
    if (await PUT(`/flow-plans/${flowPlanId}/rules/${rule.id}`, body as Record<string, unknown>)) {
      load()
    }
  }

  const move = async (idx: number, delta: number) => {
    const ids = rules.map(r => r.id as number)
    const [id] = ids.splice(idx, 1)
    ids.splice(idx + delta, 0, id)
    if (await PUT(`/flow-plans/${flowPlanId}/rules/order`, { ids })) {
      load()
    }
  }

  const onDelete = async () => {
    if (deleting && await DELETE(`/flow-plans/${flowPlanId}/rules/${deleting.id}`)) {
      load()
    }
    setDeleting(null)
  }

  const onDuplicate = (rule: Rule) => {
    setCreating({ filter: rule.filterView as unknown as MappingFilterView, result: rule.resultView as unknown as MappingResultView })
  }

  const onDownload = async () => {
    const current = await GETVersion(`/flow-plans/${flowPlanId}/rules/version`)
    const allQuestions = await GETQuestions(`/projects/${app.project.id}/questions`)
    if (!current || !allQuestions) {
      return
    }
    const json = makeRulesFile(current.version, current.saved, rules, allQuestions)
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `rules-v${current.version}.json`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const onUpload = async (data: FileUploadData) => {
    setUpload(false)
    let json
    try {
      json = JSON.parse(Buffer.from(data.data, 'hex').toString('utf-8'))
    } catch (err) {
      error(err)
      app.addError(t('Failed to parse JSON-file.'))
      return
    }
    const file = parseRulesFile(json)
    if (!file) {
      app.addError(t('Failed to parse JSON-file.'))
      return
    }
    const current = await GETVersion(`/flow-plans/${flowPlanId}/rules/version`)
    const existing = await GETQuestions(`/projects/${app.project.id}/questions`)
    if (current && existing) {
      setUploaded({ file, current, changes: questionChanges(file, existing) })
    }
  }

  const onReplaceRules = async () => {
    if (!uploaded) {
      return
    }
    setUploaded(null)
    const { file, changes } = uploaded
    const ids = { ...changes.ids }
    for (const { id, name, kind, label, options } of changes.create) {
      const created = await POSTQuestion(`/projects/${app.project.id}/questions`, { name, kind, label, options })
      if (!created) {
        loadQuestions()
        return
      }
      ids[id] = created.id
    }
    for (const { question: { name, kind, label, options }, id } of changes.update) {
      if (!await PUT(`/projects/${app.project.id}/questions/${id}`, { name, kind, label, options })) {
        loadQuestions()
        return
      }
    }
    loadQuestions()
    if (await PATCH(`/flow-plans/${flowPlanId}/rules`, remapQuestions(file.rules, ids) as Record<string, unknown>[])) {
      app.addInfo(t('Rules saved succssfully.'))
      load()
    }
  }

  const describeVersion = (version: number | null, saved: string | null): string => {
    const time = saved ? DateTime.fromISO(saved).toLocaleString(DateTime.DATETIME_SHORT, { locale: i18next.language }) : t('unknown')
    return t('version {{version}}, saved {{time}}', { version: version ?? t('unknown'), time })
  }

  // Expressions and JSON of advanced rules.
  const code = { fontFamily: fonts.mono, fontSize: '0.8rem', wordBreak: 'break-word' as const }

  return <Box sx={{ pb: 8 }}>
    <Typography variant="h1" sx={{ display: 'inline-block' }}>
      <IconButton sx={{ mt: -0.8 }} onClick={() => navigate('/rules')}><Clear/></IconButton> <Trans>Rules</Trans>
    </Typography>
    <Typography sx={{ my: 1 }} color="text.secondary">
      <Trans>Rules are tried from top to bottom and the first matching rule is used for each line.</Trans>
    </Typography>

    <Box sx={{ my: 2 }}>
      <Button variant="contained" startIcon={<Add/>} onClick={() => setCreating({})} data-cy="NewRule"><Trans>New Rule</Trans></Button>
      <Button sx={{ ml: 2 }} variant="outlined" onClick={() => navigate(`/rules/${flowPlanId}/advanced`)}><Trans>Edit JSON</Trans></Button>
      <Button sx={{ ml: 2 }} variant="outlined" onClick={() => navigate('/rules/questions')} data-cy="RuleQuestions"><Trans>Questions</Trans></Button>
      <Button sx={{ ml: 2 }} variant="outlined" onClick={onDownload}><Trans>Download</Trans></Button>
      <Button sx={{ ml: 2 }} variant="outlined" onClick={() => setUpload(true)}><Trans>Upload</Trans></Button>
    </Box>

    <Table size="small" data-cy="RuleTable">
      <TableHead>
        <TableRow>
          <TableCell width="5%"><Trans>Order</Trans></TableCell>
          <TableCell width="5%"><Trans>In use</Trans></TableCell>
          <TableCell width="30%"><Trans>Rule</Trans></TableCell>
          <TableCell><Trans>Action</Trans></TableCell>
          <TableCell width="10%" align="right"><Trans>Matches</Trans></TableCell>
          <TableCell width="12%"/>
        </TableRow>
      </TableHead>
      <TableBody>
        {rules.length === 0 && <TableRow>
          <TableCell colSpan={6}><Trans>There are no rules yet. Lines are asked when they are imported, and rules can be created from them.</Trans></TableCell>
        </TableRow>}
        {rules.map((rule, idx) => {
          const mapping = rule.kind === 'MAPPING'
          const summary = mapping ? describeConditions(t, rule.filterView as unknown as MappingFilterView) : rule.filter
          return <TableRow key={rule.id} sx={{ opacity: rule.enabled === false ? 0.5 : 1 }} data-cy={`Rule-${rule.name}`}>
            <TableCell sx={{ whiteSpace: 'nowrap' }}>
              <IconButton size="small" disabled={idx === 0} onClick={() => move(idx, -1)}><ArrowUpward fontSize="small"/></IconButton>
              <IconButton size="small" disabled={idx === rules.length - 1} onClick={() => move(idx, 1)}><ArrowDownward fontSize="small"/></IconButton>
            </TableCell>
            <TableCell>
              <Switch size="small" checked={rule.enabled !== false} onChange={(e) => save(rule, { enabled: e.target.checked })}/>
            </TableCell>
            <TableCell>
              <Box>
                {rule.name}
                {rule.origin === 'DRIVER' && <Chip size="small" label={t('Default')} sx={{ ml: 1 }}/>}
                {!mapping && <Chip size="small" label={t('Advanced')} sx={{ ml: 1 }}/>}
                {mapping && ((rule.resultView as unknown as MappingResultView)?.ask || []).length > 0 && <Chip size="small" color="info" label={t('Asks')} sx={{ ml: 1 }}/>}
              </Box>
              {summary !== rule.name && <Box sx={{ color: 'text.secondary', fontSize: '0.85em', ...(mapping ? {} : code) }}>{summary}</Box>}
            </TableCell>
            <TableCell sx={{ fontSize: '0.85em', ...(mapping ? {} : code) }}>
              {mapping ? describeAction(t, rule.resultView as unknown as MappingResultView, questions) : JSON.stringify(rule.result)}
            </TableCell>
            <TableCell align="right">
              <Tooltip title={rule.lastMatched ? t('Last matched {{time}}', { time: rule.lastMatched.substring(0, 10) }) : ''}>
                {rule.matchCount
                  ? <Link component="button" onClick={() => setShowingMatches(rule)} data-cy={`RuleMatches-${rule.name}`}>{rule.matchCount}</Link>
                  : <span>0</span>}
              </Tooltip>
            </TableCell>
            <TableCell sx={{ whiteSpace: 'nowrap' }}>
              {mapping && <IconButton size="small" title={t('Edit')} onClick={() => setEditing(rule)}><Edit fontSize="small"/></IconButton>}
              {!mapping && <IconButton size="small" title={t('Edit')} onClick={() => navigate(`/rules/${flowPlanId}/advanced`)}><Edit fontSize="small"/></IconButton>}
              {mapping && <IconButton size="small" title={t('Duplicate')} onClick={() => onDuplicate(rule)}><ContentCopy fontSize="small"/></IconButton>}
              <IconButton size="small" title={t('Delete')} onClick={() => setDeleting(rule)}><Delete fontSize="small"/></IconButton>
            </TableCell>
          </TableRow>
        })}
      </TableBody>
    </Table>

    <MappingRuleDialog
      open={editing !== null || creating !== null}
      flowPlanId={flowPlanId}
      rule={editing}
      initialFilter={creating?.filter}
      initialResult={creating?.result}
      onClose={() => { setEditing(null); setCreating(null) }}
      onSaved={() => { setEditing(null); setCreating(null); load() }}
    />

    <RuleMatchesDialog
      flowPlanId={flowPlanId}
      rule={showingMatches}
      onClose={() => setShowingMatches(null)}
    />

    <FileUploader
      visible={upload}
      title={t('Rules Upload')}
      text={t('Select a JSON-file to upload')}
      onUpload={onUpload}
      onCancel={() => setUpload(false)}
      onSuccess={() => null}
    />

    <Confirm
      open={uploaded !== null}
      title={t('Replace Rules')}
      areYouSure
      onClose={() => setUploaded(null)}
      onSubmit={onReplaceRules}
    >
      {uploaded && <>
        <Box component="span" sx={{ display: 'block' }}>{t('Replace all {{count}} current rules with {{uploaded}} rules from the file?', { count: rules.length, uploaded: uploaded.file.rules.length })}</Box>
        <Box component="span" sx={{ display: 'block', mt: 2 }}><Trans>Current rules</Trans>: {describeVersion(uploaded.current.version, uploaded.current.saved)}</Box>
        <Box component="span" sx={{ display: 'block' }}><Trans>Rules in the file</Trans>: {describeVersion(uploaded.file.version, uploaded.file.saved)}</Box>
        {uploaded.changes.create.length > 0 && <Box component="span" sx={{ display: 'block', mt: 2 }}>
          <Trans>New questions</Trans>: {uploaded.changes.create.map(q => q.label).join(', ')}
        </Box>}
        {uploaded.changes.update.length > 0 && <Box component="span" sx={{ display: 'block', mt: 2 }}>
          <Trans>Changed questions</Trans>: {uploaded.changes.update.map(u => u.question.label).join(', ')}
          <Box component="span" sx={{ display: 'block' }}><Trans>Changes to questions apply to all rules of the project using them.</Trans></Box>
        </Box>}
      </>}
    </Confirm>

    <Confirm
      open={deleting !== null}
      title={t('Delete Rule')}
      areYouSure
      onClose={() => setDeleting(null)}
      onSubmit={onDelete}
    >
      {deleting && t('Delete the rule {{name}}?', { name: deleting.name })}
    </Confirm>
  </Box>
}
