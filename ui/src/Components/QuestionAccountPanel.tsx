import React, { useState } from 'react'
import { FormControl, FormGroup, FormHelperText } from '@mui/material'
import { Question } from '../Types/API/Question'
import { AccountNumber } from '@tasenor/common'
import { RemoteAccount } from '../Types/API/RemoteAccount'

interface QuestionAccountPanelProps {
  question: Question
  onChange: (variable: string, value: boolean) => void
  remotes: Record<AccountNumber, RemoteAccount>
}

/**
 * Display error in nicely formatted manner.
 * @param props
 * @returns
 */
export const QuestionAccountPanel = (props: QuestionAccountPanelProps): React.JSX.Element => {
  const { question } = props
  const { help, label } = question

  // TODO: Formgroup belongs higher level?
  return (
    <FormGroup>
      <FormControl>
        <FormHelperText>{help}</FormHelperText>
        {label} XX
      </FormControl>
    </FormGroup>
  )
}
