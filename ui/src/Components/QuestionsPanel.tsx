import React, { } from 'react'
import { Box } from '@mui/material'
import { Question } from '../Types/API/Question'

interface QuestionsPanelProps {
  questions: Question[]
}

/**
 * Display error in nicely formatted manner.
 * @param props
 * @returns
 */
export const QuestionsPanel = (props: QuestionsPanelProps): React.JSX.Element => {
  const { questions } = props

  return (
    <Box sx={{ color: 'error.main' }}>
      {JSON.stringify(questions)}
    </Box>
  )
}
