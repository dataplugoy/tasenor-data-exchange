import React, { useEffect, useState } from 'react'
import { FormControl, FormControlLabel, FormGroup, FormHelperText, FormLabel, Switch } from '@mui/material'
import { Question } from '../Types/API/Question'
import { AccountNumber, Currency } from '@tasenor/common'
import { RemoteAccount } from '../Types/API/RemoteAccount'
import { AccountEdit } from './AccountEditorCard'

interface QuestionDebtAccountPanelProps {
  question: Question
  value?: Record<AccountNumber, AccountNumber | null>
  noHelp?: boolean
  onChange: (variable: string, value: Record<AccountNumber, AccountNumber | null>) => void
  remotes: Record<AccountNumber, RemoteAccount>
}

/**
 * Ask for an debt account.
 * @param props
 * @returns
 */
export const QuestionDebtAccountPanel = (props: QuestionDebtAccountPanelProps): React.JSX.Element => {
  const { remotes, question, noHelp, value } = props
  const { variable, help, label } = question
  const [debtAccount, setDebtAccount] = useState<RemoteAccount | null>(null)
  const [enabled, setEnabled] = useState(false)
  const currency = question.args?.currency as Currency

  const setTo = (code) => {
    props.onChange(variable, { ...value, [currency]: code })
  }

  useEffect(() => {
    if (!value || !value[currency]) {
      setTo(null)
    }
  }, [])

  const onChange = (code) => {
    setDebtAccount(remotes[code])
    setTo(code)
  }

  const onToggle = () => {
    setEnabled(!enabled)
    if (enabled) {
      setTo(null)
    } else {
      setTo(debtAccount?.number || null)
    }
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
        <AccountEdit disabled={!enabled} code={`DEBT_CURRENCY_${currency}`} remote={debtAccount || undefined} options={Object.values(remotes)} onChange={onChange}/>
      </FormControl>
    </FormGroup>
  )
}
