import i18next from 'i18next'
import React from 'react'
import { Box, TableCell, TableRow } from '@mui/material'
import { TransactionExtras } from '../Types/API/Transaction'
import { DateTime } from 'luxon'
import { Account } from '../Types/API/Account'
import clone from 'clone'
import { sprintf } from 'sprintf-js'
import { OutputItem } from '../Types/API/OutputItem'
import { Trans } from 'react-i18next'
import { RemoteId } from '../Types/API/RemoteId'
import { OutputDestination } from '../Types/API/OutputDestination'

// TODO: Split to files.

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

interface TransactionRemoteIdProps {
  id: RemoteId | null
  output: OutputDestination
}

export const TransactionRemoteId = (props: TransactionRemoteIdProps): React.JSX.Element => {
  const { id, output } = props

  if (id === null) return <></>

  switch (id.type) {
    case 'TRIVIAL':
      return <></>
    case 'FILE':
      return <><Trans>Saved to file:</Trans> {id.path}</>
    case 'TASENOR':
      return <><Trans>Tasenor document API URL:</Trans>
        <Box sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{`${output.settings.host}/db/${output.settings.database}/document/${id.doc}`}</Box>
      </>
  }
}

interface TransactionDeliveryLinePops {
  tx: OutputItem
  output: OutputDestination
}

export const TransactionDeliveryLine = (props: TransactionDeliveryLinePops): React.JSX.Element => {
  const { tx, output } = props
  const { delivered, skipped } = tx

  return (
    <TableRow>
      <TableCell className="tx"></TableCell>
      <TableCell className="tx"></TableCell>
      {delivered && <TableCell className="tx delivered"><Trans>Delivered successfully.</Trans> <TransactionRemoteId id={tx.remoteId} output={output}/></TableCell>}
      {skipped && <TableCell className="tx skipped"><Trans>Delivery has been skipped.</Trans></TableCell>}
      {!delivered && !skipped && <TableCell className="tx pending"><Trans>Delivery is pending.</Trans></TableCell>}
      <TableCell className="tx" align="right"></TableCell>
      <TableCell className="tx" align="right"></TableCell>
    </TableRow>
  )
}
