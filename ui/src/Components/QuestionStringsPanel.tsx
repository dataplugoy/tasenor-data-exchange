import React, { useEffect, useState } from 'react'
import { FormControl, FormControlLabel, FormGroup, FormHelperText, FormLabel, Switch, TextField } from '@mui/material'
import { Question } from '../Types/API/Question'

interface QuestionStringsPanelProps {
  question: Question
  value?: string[]
  onChange: (variable: string, value: string[]) => void
}

/**
 * Display error in nicely formatted manner.
 * @param props
 * @returns
 */
export const QuestionStringsPanel = (props: QuestionStringsPanelProps): React.JSX.Element => {
  const { question, value } = props
  const { help, label, variable } = question
  const useComma = !value || value.find(tag => tag.indexOf(',') >= 0) === undefined
  const [str, setStr] = useState<string>(value ? value.join(useComma ? ',' : ';') : '')

  const onChange = (s: string) => {
    setStr(s)
    const value = s.indexOf(',') >= 0 ? s.split(',') : s.split(';')
    const tags = value.map(v => v.trim()).filter(v => v !== '')
    props.onChange(variable, tags)
  }

  return (
    <FormGroup>
      <FormControl>
        <TextField onChange={e => onChange(e.target.value)} fullWidth value={str} name="host" label={label}/>
        <FormHelperText>{help}</FormHelperText>
      </FormControl>
    </FormGroup>
  )
}
