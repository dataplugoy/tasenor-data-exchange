import React, { useEffect, useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, Typography } from '@mui/material'
import { Question } from '../Types/API/Question'
import { Trans } from 'react-i18next'
import { QuestionPanel } from './QuestionPanel'
import { AccountNumber } from '@tasenor/common'
import { RemoteAccount } from '../Types/API/RemoteAccount'
import { useGET } from '../Hooks/useNet'
import { useApp } from '../Hooks/useApp'

interface QuestionsPanelProps {
  questions: Question[]
  onCancel: () => void
  onSave: (answers: Record<string, unknown>) => void
}

/**
 * Display error in nicely formatted manner.
 * @param props
 * @returns
 */
export const QuestionsPanel = (props: QuestionsPanelProps): React.JSX.Element => {
  const { questions } = props
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [remotes, setRemotes] = useState<Record<AccountNumber, RemoteAccount>>({})
  const [loadingRemotes, setLoadingRemotes] = useState(false)
  const GET = useGET<RemoteAccount[]>()
  const app = useApp()

  useEffect(() => {
    // Sort out accounts.
    const accountQuestion = questions.find(question => question.type === 'ACCOUNT' || question.type === 'DEBT_ACCOUNT')
    if (accountQuestion) {
      // TODO: For debt account we need different hints.
      setLoadingRemotes(true)
      GET(`/output-destinations/${accountQuestion.args?.destinationId}/accounts`).then(res => {
        res && setRemotes(res.reduce((prev, cur) => ({ ...prev, [cur.number]: cur }), {}))
        setLoadingRemotes(false)
        app.setDimming(false)
      })
    } else {
      app.setDimming(false)
    }

    // Fill in defaults.
    for (const question of questions) {
      let ticker
      switch (question.type) {
        case 'TICKER':
          answers.tickers = answers.tickers || {}
          ticker = question.args?.ticker || ''
          Object.assign(answers.tickers as Object, { [ticker]: ticker })
      }
    }
  }, [questions])

  const onCancel = () => {
    props.onCancel()
  }

  const onContinue = () => {
    props.onSave(answers)
  }

  const onChange = (variable: string, value: unknown) => {
    setAnswers({ ...answers, [variable]: value })
  }

  const askingAccounts = questions.some(q => q.type === 'ACCOUNT')

  return (
    <Dialog open={questions.length > 0} fullWidth maxWidth={questions.some(q => q.type === 'UNMATCHED_LINE' || q.type === 'RULE_QUESTIONS') ? 'lg' : 'sm'}>
      <DialogTitle><Trans>We Need More Information</Trans></DialogTitle>

      <DialogContent>
        {askingAccounts && <Typography sx={{ mb: 1 }}>
          <Trans>The transactions use the following accounts that are not yet linked to the accounts of the bookkeeping. Select for each one the account where it is booked in the bookkeeping.</Trans>
        </Typography>}
        {askingAccounts && loadingRemotes && <>
          <Typography variant="body2" color="text.secondary"><Trans>Fetching the accounts from the bookkeeping...</Trans></Typography>
          <LinearProgress sx={{ mt: 1, mb: 1 }}/>
        </>}
        {questions.map((question, idx) => <QuestionPanel onChange={onChange} key={idx} remotes={remotes} question={question}/>)}
      </DialogContent>

      <DialogActions>
        <Button data-cy="DialogButton-Cancel" variant="outlined" onClick={onCancel}><Trans>Cancel</Trans></Button>
        <Button data-cy="DialogButton-Delete" onClick={onContinue}><Trans>Continue</Trans></Button>
      </DialogActions>
    </Dialog>
  )
}
