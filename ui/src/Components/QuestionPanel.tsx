import React, { } from 'react'
import { Box } from '@mui/material'
import { Question } from '../Types/API/Question'
import { QuestionBooleanPanel } from './QuestionBooleanPanel'
import { QuestionEnumPanel } from './QuestionEnumPanel'
import { QuestionAccountPanel } from './QuestionAccountPanel'
import { AccountNumber } from '@tasenor/common'
import { RemoteAccount } from '../Types/API/RemoteAccount'

interface QuestionPanelProps {
  question: Question
  remotes: Record<AccountNumber, RemoteAccount>
  onChange: (variable: string, value: unknown) => void
}

/**
 * Display error in nicely formatted manner.
 * @param props
 * @returns
 */
export const QuestionPanel = (props: QuestionPanelProps): React.JSX.Element => {
  const { question, onChange, remotes } = props
  switch (question.type) {
    case 'BOOLEAN':
      return <QuestionBooleanPanel question={question} onChange={onChange}/>
    case 'ENUM':
      return <QuestionEnumPanel question={question} onChange={onChange}/>
    case 'ACCOUNT':
      return <QuestionAccountPanel question={question} onChange={onChange} remotes={remotes}/>
  }

  return (
    <Box sx={{ border: '1px solid red', p: 2 }}>
      NOT IMPLEMENTED: {question.type} QUESTION
    </Box>
  )
}
