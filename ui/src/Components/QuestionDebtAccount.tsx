import React, { useState } from 'react'
import { FormControl, FormControlLabel, FormGroup, FormHelperText, FormLabel, Switch } from '@mui/material'
import { Question } from '../Types/API/Question'
import { AccountNumber } from '@tasenor/common'
import { RemoteAccount } from '../Types/API/RemoteAccount'
import { AccountEdit } from './AccountEditorCard'

interface QuestionDebtAccountPanelProps {
  question: Question
  value?: Record<AccountNumber, RemoteAccount>
  noHelp?: boolean
  onChange: (variable: string, value: Record<AccountNumber, RemoteAccount>) => void
  remotes: Record<AccountNumber, RemoteAccount>
}

/**
 * Ask for an debt account.
 * @param props
 * @returns
 */
export const QuestionDebtAccountPanel = (props: QuestionDebtAccountPanelProps): React.JSX.Element => {
  const { remotes, question, noHelp } = props
  const { variable, help, label } = question
  const [debtAccount, setDebtAccount] = useState<RemoteAccount | undefined>(undefined)
  const [enabled, setEnabled] = useState(false)

  const onChange = () => {
  }

  const onToggle = () => {
    setEnabled(!enabled)
  }

  return (
    <FormGroup>
      <FormControl>
        {!noHelp && <FormHelperText>{help}</FormHelperText>}
        <FormControlLabel control={
          <Switch checked={enabled} onChange={onToggle} />
        } label={<FormLabel>{label}</FormLabel>} />
      </FormControl>

      <FormControl sx={{ mt: 1 }}>
        <AccountEdit disabled={!enabled} code={''} remote={undefined} options={Object.values(remotes)} onChange={onChange}/>
      </FormControl>
    </FormGroup>
  )
}
