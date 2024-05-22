import React, { useState } from 'react'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControlLabel, FormGroup, FormHelperText, Switch } from '@mui/material'
import { Question } from '../Types/API/Question'
import { Trans } from 'react-i18next'

interface QuestionBooleanPanelProps {
  question: Question
  onChange: (variable: string, value: boolean) => void
}

/**
 * Display error in nicely formatted manner.
 * @param props
 * @returns
 */
export const QuestionBooleanPanel = (props: QuestionBooleanPanelProps): React.JSX.Element => {
  const { question, onChange } = props
  const { help, label, variable } = question
  const [checked, setChecked] = useState<boolean>(false)

  const onToggle = () => {
    const value = !checked
    setChecked(value)
    onChange(variable, value)
  }

  return (
    <FormGroup>
      <FormHelperText>{help}</FormHelperText>
      <FormControlLabel control={
        <Switch checked={checked} onChange={onToggle} />
      } label={label} />
    </FormGroup>
  )
}
