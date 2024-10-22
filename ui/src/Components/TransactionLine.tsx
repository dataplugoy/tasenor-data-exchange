import i18next from 'i18next'
import React from 'react'
import { TableCell, TableRow } from '@mui/material'
import { TransactionExtras } from '../Types/API/Transaction'
import { DateTime } from 'luxon'
import { Account } from '../Types/API/Account'
import { TransactionExtrasLine } from './TransactionExtrasLine'
import { credit, debit } from '../Helpers/stringify'

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

  const className = props.first ? 'tx first' : 'tx'

  return (
    <>
      <TableRow>
        <TableCell className={className}>
          {time && time.toLocaleString({}, { locale: i18next.language })}
        </TableCell>
        <TableCell className={className}>{account}</TableCell>
        <TableCell className={className}>{text}</TableCell>
        <TableCell className={className + ' debit'} align="right">{debit(amount)}</TableCell>
        <TableCell className={className + ' credit'} align="right">{credit(amount)}</TableCell>
      </TableRow>
      {Object.keys(extras).length > 0 && <TransactionExtrasLine account={account} extras={extras}/>}
    </>
  )
}
