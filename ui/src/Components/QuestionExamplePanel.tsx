import React from 'react'
import { QuestionExample } from '../Types/API/QuestionExample'
import { Box, Typography } from '@mui/material'
import { Trans } from 'react-i18next'

interface QuestionExamplePanelProps {
  example: QuestionExample
}

/**
 * Render example line for question.
 * @param props
 * @returns
 */
export const QuestionExamplePanel = (props: QuestionExamplePanelProps): React.JSX.Element => {
  const { example } = props
  const { line, text } = example

  return <Box sx={{ my: 1, p: 2, backgroundColor: 'background.default', borderRadius: 1 }}>
    <Box sx={{ color: 'primary.main' }}>
      <Trans>Example:</Trans>
    </Box>
    <Box>
      <Trans>Line:</Trans> {line}
    </Box>
    <Typography color="success.main">
      {text}
    </Typography>
  </Box>
}
