import React, { } from 'react'
import { Box, SxProps, Theme } from '@mui/material'
import { Question } from '../Types/API/Question'
import { QuestionBooleanPanel } from './QuestionBooleanPanel'
import { QuestionEnumPanel } from './QuestionEnumPanel'
import { QuestionAccountPanel } from './QuestionAccountPanel'
import { AccountNumber } from '@tasenor/common'
import { RemoteAccount } from '../Types/API/RemoteAccount'
import { QuestionStringsPanel } from './QuestionStringsPanel'
import { QuestionDebtAccountPanel } from './QuestionDebtAccount'

interface QuestionPanelProps {
  question: Question
  value?: unknown
  remotes: Record<AccountNumber, RemoteAccount>
  onChange: (variable: string, value: unknown) => void
  noHelp?: boolean
  sx?: SxProps<Theme>
}

/**
 * Display error in nicely formatted manner.
 * @param props
 * @returns
 */
export const QuestionPanel = (props: QuestionPanelProps): React.JSX.Element => {
  const { question, onChange, remotes, noHelp, value, sx } = props

  switch (question.type) {
    case 'BOOLEAN':
      return <Box sx={sx}>
        <QuestionBooleanPanel question={question} value={value as undefined | boolean} onChange={onChange} noHelp={noHelp}/>
      </Box>
    case 'ENUM':
      return <Box sx={sx}>
        <QuestionEnumPanel question={question} value={value as undefined | string} onChange={onChange} noHelp={noHelp}/>
      </Box>
    case 'ACCOUNT':
      return <Box sx={sx}>
        <QuestionAccountPanel question={question} value={value as undefined | AccountNumber} onChange={onChange} remotes={remotes}/>
      </Box>
    case 'STRINGS':
      return <Box sx={sx}>
        <QuestionStringsPanel question={question} value={value as undefined | string[]} onChange={onChange}/>
      </Box>
    case 'DEBT_ACCOUNT':
      return <Box sx={sx}>
        <QuestionDebtAccountPanel question={question} value={value as undefined | Record<AccountNumber, RemoteAccount>} onChange={onChange} remotes={remotes}/>
      </Box>
  }

  return (
    <Box sx={{ border: '1px solid red', p: 2 }}>
      NOT IMPLEMENTED: {question.type} QUESTION
    </Box>
  )
}
