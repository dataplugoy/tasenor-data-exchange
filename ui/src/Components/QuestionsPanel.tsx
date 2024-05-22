import React, { useState } from 'react'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import { Question } from '../Types/API/Question'
import { Trans } from 'react-i18next'
import { QuestionPanel } from './QuestionPanel'

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
      <DialogTitle>We Need More Information</DialogTitle>

      <DialogContent>
        {questions.map((question, idx) => <QuestionPanel onChange={onChange} key={idx} question={question}/>)}
      </DialogContent>

      <DialogActions>
        <Button data-cy="DialogButton-Cancel" variant="outlined" onClick={onCancel}><Trans>Cancel</Trans></Button>
        <Button data-cy="DialogButton-Delete" onClick={onContinue}><Trans>Continue</Trans></Button>
      </DialogActions>
    </Dialog>
  )
}
