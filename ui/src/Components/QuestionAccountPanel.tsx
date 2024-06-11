import React, { useState } from 'react'
import { FormControl, FormGroup } from '@mui/material'
import { Question } from '../Types/API/Question'
import { AccountNumber } from '@tasenor/common'
import { RemoteAccount } from '../Types/API/RemoteAccount'
import { AccountEdit } from './AccountEditorCard'

interface QuestionAccountPanelProps {
  question: Question
  value?: AccountNumber
  onChange: (variable: string, value: AccountNumber) => void
  remotes: Record<AccountNumber, RemoteAccount>
}

/**
 * Display error in nicely formatted manner.
 * @param props
 * @returns
 */
export const QuestionAccountPanel = (props: QuestionAccountPanelProps): React.JSX.Element => {
  const { remotes, question } = props
  const { variable } = question
  const [remote, setRemote] = useState<RemoteAccount | undefined>(undefined)

  const onChange = (code) => {
    setRemote(remotes[code])
    props.onChange(variable, code)
  }

  const [, code] = variable.split('.')

  return (
    <FormGroup>
      <FormControl sx={{ mt: 1 }}>
        <AccountEdit code={code} remote={remote} options={Object.values(remotes)} onChange={onChange}/>
      </FormControl>
    </FormGroup>
  )
}
