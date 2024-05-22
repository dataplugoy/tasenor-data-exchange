import React, { } from 'react'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControlLabel, FormGroup, FormHelperText, Switch } from '@mui/material'
import { Question } from '../Types/API/Question'
import { Trans } from 'react-i18next'

interface QuestionBooleanPanelProps {
  question: Question
}

/**
 * Display error in nicely formatted manner.
 * @param props
 * @returns
 */
export const QuestionBooleanPanel = (props: QuestionBooleanPanelProps): React.JSX.Element => {
  const { question } = props
  const { help, label, variable } = question

  return (
    <FormGroup>
      <FormHelperText>{help}</FormHelperText>
      <FormControlLabel control={<Switch  />} label={label} />
    </FormGroup>
  )
}
