import React, { useEffect, useState } from 'react'
import { FormControl, FormGroup, FormHelperText, TextField } from '@mui/material'
import { Question } from '../Types/API/Question'

interface QuestionTickerPanelProps {
  question: Question
  value?: Record<string, string>
  onChange: (variable: string, value: Record<string, string>) => void
}

/**
 * Ask for an account.
 * @param props
 * @returns
 */
export const QuestionTickerPanel = (props: QuestionTickerPanelProps): React.JSX.Element => {
  const { question, value } = props
  const { help, label, args, variable } = question
  const [str, setStr] = useState<string>('')
  const [ticker, setTicker] = useState<string>('')

  const onChange = (s) => {
    setStr(s)
    props.onChange(variable, { ...value, [ticker]: s })
  }

  useEffect(() => {
    const ticker: string = args ? args.ticker as string : ''
    if (!ticker) {
      throw new Error(`Invalid question ${JSON.stringify(question)} does not define ticker argument.`)
    }
    setTicker(ticker)
    setStr((value || {})[ticker] || ticker)
  }, [args])

  return (
    <FormGroup>
      <FormControl sx={{ mt: 1 }}>
        <TextField onChange={e => onChange(e.target.value)} fullWidth value={str} label={label}/>
        <FormHelperText>{help}</FormHelperText>
      </FormControl>
    </FormGroup>
  )
}
