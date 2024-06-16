import i18next from 'i18next'
import React from 'react'
import { TableCell, TableRow } from '@mui/material'
import { TransactionExtras } from '../Types/API/Transaction'
import { DateTime } from 'luxon'
import { Account } from '../Types/API/Account'
import { sprintf } from 'sprintf-js'
import { TransactionExtrasLine } from './TransactionExtrasLine'

interface TransactionLineProps {
  first?: boolean
  time?: DateTime
  text: string
  account: Account
  amount: string | number
  extras: TransactionExtras
}

export const TransactionLine = (props: TransactionLineProps): React.JSX.Element => {
  const { time, text, account, amount, extras } = props

  // TODO: Make num lib for displaying.
  const num = (amount: number | string, type: 'debit' | 'credit'): string => {
    if (amount === '') {
      return ''
    }
    const numeric = typeof amount === 'string' ? parseFloat(amount) : amount
    if (type === 'debit') {
      // TODO: Localize.
      return numeric >= 0 ? `${sprintf('%.2f', numeric)}` : ''
    }
    return numeric < 0 ? `${sprintf('%.2f', Math.abs(numeric))}` : ''
  }

  const className = props.first ? 'tx first' : 'tx'
  return (
    <>
      <TableRow>
        <TableCell className={className}>
          {time && time.toLocaleString({}, { locale: i18next.language })}
        </TableCell>
        <TableCell className={className}>{account}</TableCell>
        <TableCell className={className}>{text}</TableCell>
        <TableCell className={className + ' debit'} align="right">{num(amount, 'debit')}</TableCell>
        <TableCell className={className + ' credit'} align="right">{num(amount, 'credit')}</TableCell>
      </TableRow>
      {Object.keys(extras).length > 0 && <TransactionExtrasLine account={account} extras={extras}/>}
    </>
  )
}
