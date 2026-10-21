import React, { useEffect, useState } from 'react'
import { Alert, Box, FormHelperText, FormLabel } from '@mui/material'
import { useTranslation } from 'react-i18next'
import clone from 'clone'
import { Currency, Language } from '@tasenor/common'
import { Question } from '../Types/API/Question'
import { OpeningState } from '../Types/API/OpeningState'
import { BalanceData } from '../Types/API/BalanceData'
import { StockData } from '../Types/API/StockData'
import { BalanceTable } from './BalanceTable'
import { StockTable } from './StockTable'

interface QuestionOpeningStatePanelProps {
  question: Question
  noHelp?: boolean
  onChange: (variable: string, value: OpeningState) => void
}

/**
 * Show the proposed opening balances and assets for checking and correcting.
 * @param props
 * @returns
 */
export const QuestionOpeningStatePanel = (props: QuestionOpeningStatePanelProps): React.JSX.Element => {
  const { question, noHelp, onChange } = props
  const { variable, help, label } = question
  const { t, i18n } = useTranslation()
  // The tables edit the values in place, so the answer always has the latest values.
  const [state] = useState<OpeningState>(() => clone(question.args?.openingState as OpeningState))
  const currency = question.args?.currency as Currency
  const language = i18n.language as Language

  useEffect(() => {
    onChange(variable, state)
  }, [])

  const onSaveBalance = async (balance: BalanceData) => {
    onChange(variable, { ...state, balance })
  }

  const onSaveStock = async (stock: StockData) => {
    onChange(variable, { ...state, stock: stock as unknown as OpeningState['stock'] })
  }

  return (
    <Box>
      <FormLabel>{label}</FormLabel>
      {!noHelp && <FormHelperText>{help}</FormHelperText>}
      {state.notes.map((note, idx) => <Alert key={idx} severity="info" sx={{ mt: 1 }}>{note}</Alert>)}
      <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
        <BalanceTable currency={currency} language={language} balance={state.balance} footer={t('Balances of the accounts before the first transactions.')} onSave={onSaveBalance}/>
        <StockTable currency={currency} language={language} stock={state.stock as unknown as StockData} footer={t('Assets of the accounts before the first transactions.')} onSave={onSaveStock}/>
      </Box>
    </Box>
  )
}
