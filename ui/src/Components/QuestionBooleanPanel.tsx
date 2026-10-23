import React, { useEffect, useState } from 'react'
import { FormControl, FormControlLabel, FormGroup, FormHelperText, FormLabel, Switch } from '@mui/material'
import { Question } from '../Types/API/Question'

interface QuestionBooleanPanelProps {
  question: Question
  value?: boolean
  onChange: (variable: string, value: boolean) => void
  noHelp?: boolean
}

/**
 * Ask boolean value.
 * @param props
 * @returns
 */
export const QuestionBooleanPanel = (props: QuestionBooleanPanelProps): React.JSX.Element => {
  const { question, onChange, noHelp, value } = props
  const { help, label, variable } = question
  const [checked, setChecked] = useState<boolean>(value || false)

  useEffect(() => {
    onChange(variable, value || false)
  }, [])

  const onToggle = () => {
    const value = !checked
    setChecked(value)
    onChange(variable, value)
  }

  return (
    <FormGroup>
      <FormControl>
        {!noHelp && <FormHelperText>{help}</FormHelperText>}
        <FormControlLabel control={
          <Switch checked={checked} onChange={onToggle} />
        } label={<FormLabel>{label}</FormLabel>} />
      </FormControl>
    </FormGroup>
  )
}
