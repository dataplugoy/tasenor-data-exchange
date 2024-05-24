import React, { } from 'react'
import { Box } from '@mui/material'
import { Question } from '../Types/API/Question'
import { QuestionBooleanPanel } from './QuestionBooleanPanel'
import { QuestionEnumPanel } from './QuestionEnumPanel'

interface QuestionPanelProps {
  question: Question
  onChange: (variable: string, value: unknown) => void
}

/**
 * Display error in nicely formatted manner.
 * @param props
 * @returns
 */
export const QuestionPanel = (props: QuestionPanelProps): React.JSX.Element => {
  const { question, onChange } = props
  switch (question.type) {
    case 'BOOLEAN':
      return <QuestionBooleanPanel question={question} onChange={onChange}/>
    case 'ENUM':
      return <QuestionEnumPanel question={question} onChange={onChange}/>
  }

  return (
    <Box sx={{ border: '1px solid red', p: 2 }}>
      NOT IMPLEMENTED: {question.type} QUESTION
    </Box>
  )
}
