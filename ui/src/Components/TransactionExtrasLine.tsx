import React from 'react'
import { TableCell, TableRow } from '@mui/material'
import { TransactionExtras } from '../Types/API/Transaction'
import { Account } from '../Types/API/Account'
import clone from 'clone'

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
