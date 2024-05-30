import i18next from 'i18next'
import React from 'react'
import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material'
import { Transaction as APITransaction, TransactionLine as APITransactionLine, TransactionExtras } from '../Types/API/Transaction'
import { Trans } from 'react-i18next'
import { DateTime } from 'luxon'
import { Account } from '../Types/API/Account'
import clone from 'clone'
import { sprintf } from 'sprintf-js'

interface TransactionExtrasLineProps {
  extras: TransactionExtras
  account: Account
}

export const TransactionExtrasLine = (props: TransactionExtrasLineProps): React.JSX.Element => {
  const extras = clone(props.extras)

  let text = ''

  if ('asset' in extras && 'assetChange' in extras) {
    // TODO: Make num lib for displaying.
    const sign = parseFloat(`${extras.assetChange}`) < 0 ? '' : '+'
    text = `Δ ${sign}${extras.assetChange} ${extras.asset}`
    delete extras.assetChange
    delete extras.asset
  }

  if (Object.keys(extras).length) {
    throw new Error(`Unable to figure out how to display transaction extras "${Object.keys(extras).join('", "')}".`)
  }

  return (
    <TableRow>
      <TableCell className="tx"></TableCell>
      <TableCell className="tx"></TableCell>
      <TableCell className="tx extras">{text}</TableCell>
      <TableCell className="tx"></TableCell>
      <TableCell className="tx"></TableCell>
    </TableRow>
  )
}

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

interface TransactionProps {
  tx: APITransaction
}

export const Transaction = (props: TransactionProps): React.JSX.Element => {
  const { tx } = props

  const firstLine: APITransactionLine = tx.lines.length
    ? tx.lines[0]
    : {
        account: '',
        amount: '',
        text: '',
        extras: {}
      }

  const otherLines: APITransactionLine[] = tx.lines.length > 1 ? tx.lines.slice(1, tx.lines.length) : []

  return (
    <>
      <TransactionLine
        first
        time={DateTime.fromISO(tx.time)}
        account={firstLine.account}
        text={firstLine.text}
        amount={firstLine.amount}
        extras={firstLine.extras}
      />
      {
        otherLines.map((line, idx) =>
          <TransactionLine
            key={idx}
            account={line.account}
            text={line.text}
            amount={line.amount}
            extras={line.extras}
          />
        )
      }
    </>
  )
}

interface TransactionTableProps {
  txs: APITransaction[]
}

export const TransactionTable = (props: TransactionTableProps): React.JSX.Element => {
  const { txs } = props
  return (
    <Table data-cy="TransactionTable" size="small" className="tx">
      <TableHead>
        <TableRow>
          <TableCell className="tx heading" width="10%" variant="head"><Trans>Date</Trans></TableCell>
          <TableCell className="tx heading" width="15%" variant="head"><Trans>Account</Trans></TableCell>
          <TableCell className="tx heading" variant="head"><Trans>Description</Trans></TableCell>
          <TableCell className="tx heading debit" width="10%" align="right" variant="head"><Trans>Debit</Trans></TableCell>
          <TableCell className="tx heading credit" width="10%" align="right" variant="head"><Trans>Credit</Trans></TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {txs.map((tx, idx) => <Transaction key={idx} tx={tx}/>)}
        {txs.length === 0 && <TableRow><TableCell className="tx"/><TableCell className="tx" colSpan={3}><Trans>No transctions</Trans></TableCell></TableRow>}
      </TableBody>
    </Table>
  )
}
