import React from 'react'
import { FormControl, FormControlLabel, FormGroup, FormHelperText, FormLabel, Radio, RadioGroup } from '@mui/material'
import { Question } from '../Types/API/Question'
import { QuestionArgs } from '../Types/API/QuestionArgs'
import { useTranslation } from 'react-i18next'

interface QuestionEnumPanelProps {
  question: Question
  onChange: (variable: string, value: string) => void
}

/**
 * Display error in nicely formatted manner.
 * @param props
 * @returns
 */
export const QuestionEnumPanel = (props: QuestionEnumPanelProps): React.JSX.Element => {
  const { question } = props
  const { help, label, variable } = question
  const args: QuestionArgs = question.args || {}
  const options = args.options || []
  const { t } = useTranslation()

  const onChange = (e) => {
    props.onChange(variable, e.target.value)
  }

  return (
    <FormGroup>
      <FormControl>
        <FormHelperText>{help}</FormHelperText>
        <FormLabel id={`label-${variable}`}>{label}</FormLabel>
        <RadioGroup aria-labelledby={`label-${variable}`}>
        {
          options.map(option =>
            <FormControlLabel
              key={option}
              value={option}
              control={<Radio />}
              label={t(`Option-${variable}-${option}`) === `Option-${variable}-${option}` ? t(`Option-${option}`) : t(`Option-${variable}-${option}`)}
              onChange={onChange}
            />
          )
        }
        </RadioGroup>
      </FormControl>
    </FormGroup>
  )
}
