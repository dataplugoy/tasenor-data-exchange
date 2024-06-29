import React, { useEffect, useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
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
  const GET = useGET<RemoteAccount[]>()
  const app = useApp()

  useEffect(() => {
    const accountQuestion = questions.find(question => question.type === 'ACCOUNT' || question.type === 'DEBT_ACCOUNT')
    if (accountQuestion) {
      // TODO: For debt account we need different hints.
      GET(`/output-destinations/${accountQuestion.args?.destinationId}/accounts`).then(res => {
        res && setRemotes(res.reduce((prev, cur) => ({ ...prev, [cur.number]: cur }), {}))
        app.setDimming(false)
      })
    } else {
      app.setDimming(false)
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

  return (
    <Dialog open={questions.length > 0} fullWidth>
      <DialogTitle><Trans>We Need More Information</Trans></DialogTitle>

      <DialogContent>
        {questions.map((question, idx) => <QuestionPanel onChange={onChange} key={idx} remotes={remotes} question={question}/>)}
      </DialogContent>

      <DialogActions>
        <Button data-cy="DialogButton-Cancel" variant="outlined" onClick={onCancel}><Trans>Cancel</Trans></Button>
        <Button data-cy="DialogButton-Delete" onClick={onContinue}><Trans>Continue</Trans></Button>
      </DialogActions>
    </Dialog>
  )
}
