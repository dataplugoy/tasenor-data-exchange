import React, { useEffect, useState } from 'react'
import { Box, Button, MenuItem, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material'
import { Trans, useTranslation } from 'react-i18next'
import { Question } from '../Types/API/Question'
import { RuleQuestion } from '../Types/API/RuleQuestion'
import { RuleQuestionAnswer } from '../Types/API/RuleQuestionAnswer'
import { LineAnswers } from '../Types/API/LineAnswers'
import { LineInfo, counterparty } from '../Helpers/rules'

type Item = LineInfo & {
  key: string
  ruleId: number
  ruleName: string
  ask: number[]
  defaults: Record<string, RuleQuestionAnswer>
}

interface QuestionRuleQuestionsPanelProps {
  question: Question
  onChange: (variable: string, value: unknown) => void
}

/**
 * Check if all questions of the line are answered.
 */
function isAnswered(item: Item, answers: Record<string, RuleQuestionAnswer>, questions: Record<number, RuleQuestion>): boolean {
  return item.ask.every(id => !questions[id] || answers[id] !== undefined)
}

/**
 * Lines matched by rules asking questions: answer the questions for each line.
 */
export const QuestionRuleQuestionsPanel = (props: QuestionRuleQuestionsPanelProps): React.JSX.Element => {
  const { question, onChange } = props
  const { t } = useTranslation()
  const items = (question.args?.items || []) as Item[]
  const questions: Record<number, RuleQuestion> = ((question.args?.questions || []) as RuleQuestion[]).reduce((prev, cur) => ({ ...prev, [cur.id]: cur }), {})
  const [answers, setAnswers] = useState<Record<string, Record<string, RuleQuestionAnswer>>>({})

  // Start from the defaults.
  useEffect(() => {
    const start: Record<string, Record<string, RuleQuestionAnswer>> = {}
    for (const item of items) {
      start[item.key] = {}
      for (const id of item.ask) {
        const q = questions[id]
        const def = item.defaults[id]
        if (q?.kind === 'TEXT') {
          start[item.key][id] = { name: q.name, text: def?.text ?? '' }
        } else if (q && def && def.option !== undefined && q.options[def.option]) {
          start[item.key][id] = answerFor(q, def.option)
        }
      }
    }
    setAnswers(start)
  }, [question])

  // Only fully answered lines are sent, the rest are asked again.
  useEffect(() => {
    const value: Record<string, LineAnswers> = {}
    for (const item of items) {
      if (answers[item.key] && isAnswered(item, answers[item.key], questions)) {
        value[item.key] = { rule: item.ruleId, answers: answers[item.key] }
      }
    }
    onChange(question.variable, value)
  }, [answers])

  const answerFor = (q: RuleQuestion, option: number): RuleQuestionAnswer => q.kind === 'TAGS'
    ? { option, tags: q.options[option].tags || [] }
    : { option, account: q.options[option].account }

  const setAnswer = (key: string, id: number, answer: RuleQuestionAnswer | undefined) => {
    const line = { ...(answers[key] || {}) }
    if (answer) {
      line[id] = answer
    } else {
      delete line[id]
    }
    setAnswers({ ...answers, [key]: line })
  }

  const copyFirst = (rule: Item[]) => {
    const first = answers[rule[0].key] || {}
    const next = { ...answers }
    for (const item of rule.slice(1)) {
      next[item.key] = { ...first }
    }
    setAnswers(next)
  }

  // Lines grouped by the rule.
  const groups: Item[][] = []
  for (const item of items) {
    const group = groups.find(g => g[0].ruleId === item.ruleId)
    if (group) {
      group.push(item)
    } else {
      groups.push([item])
    }
  }

  return <Box sx={{ mt: 2 }}>
    <Typography sx={{ mb: 1 }}>{question.help}</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
      <Trans>Lines without all answers are asked again later.</Trans>
    </Typography>
    {groups.map(group => <Box key={group[0].ruleId} sx={{ mb: 2 }} data-cy={`RuleQuestions-${group[0].ruleName}`}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="subtitle1">{t('Rule {{name}}', { name: group[0].ruleName })}</Typography>
        {group.length > 1 && <Button size="small" onClick={() => copyFirst(group)} data-cy="UseForAll"><Trans>Use the first answers for all</Trans></Button>}
      </Box>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell><Trans>Date</Trans></TableCell>
            <TableCell align="right"><Trans>Amount</Trans></TableCell>
            <TableCell><Trans>Line</Trans></TableCell>
            {group[0].ask.filter(id => questions[id]).map(id => <TableCell key={id}>{questions[id].label}</TableCell>)}
          </TableRow>
        </TableHead>
        <TableBody>
          {group.map(item => <TableRow key={item.key} data-cy={`Asked-${item.key}`}>
            <TableCell sx={{ whiteSpace: 'nowrap' }}>{item.time}</TableCell>
            <TableCell align="right">{item.total}</TableCell>
            <TableCell>
              <Box>{counterparty(item) || item.text}</Box>
              <Box sx={{ color: 'text.secondary', fontSize: '0.8em' }}>
                {item.text}{item.fields.Viesti ? ` – ${item.fields.Viesti}` : ''}
              </Box>
            </TableCell>
            {item.ask.filter(id => questions[id]).map(id => {
              const q = questions[id]
              const answer = answers[item.key]?.[id]
              return <TableCell key={id} sx={{ minWidth: 180 }}>
                {q.kind === 'TEXT'
                  ? <TextField
                      size="small"
                      fullWidth
                      value={answer?.text ?? ''}
                      onChange={(e) => setAnswer(item.key, id, { name: q.name, text: e.target.value })}
                      data-cy={`Answer-${q.name}`}
                    />
                  : <TextField
                      select
                      size="small"
                      fullWidth
                      value={answer?.option ?? ''}
                      onChange={(e) => setAnswer(item.key, id, e.target.value === '' ? undefined : answerFor(q, Number(e.target.value)))}
                      data-cy={`Answer-${q.name}`}
                    >
                      {q.options.map((o, idx) => <MenuItem key={idx} value={idx}>{o.label}</MenuItem>)}
                    </TextField>}
              </TableCell>
            })}
          </TableRow>)}
        </TableBody>
      </Table>
    </Box>)}
  </Box>
}
