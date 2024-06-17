import React from 'react'
import { Box, TableCell, TableRow } from '@mui/material'
import { TransactionExtras } from '../Types/API/Transaction'
import { Account } from '../Types/API/Account'
import clone from 'clone'
import { TagChip } from './TagChip'

interface TransactionExtrasLineProps {
  extras: TransactionExtras
  account: Account
}

export const TransactionExtrasLine = (props: TransactionExtrasLineProps): React.JSX.Element => {
  const extras = clone(props.extras)

  const parts: React.JSX.Element[] = []

  if ('asset' in extras && 'assetChange' in extras) {
    const sign = parseFloat(`${extras.assetChange}`) < 0 ? '' : '+'
    parts.push(<Box key="asset" component="span">{`Δ ${sign}${extras.assetChange} ${extras.asset}`}</Box>)
    delete extras.assetChange
    delete extras.asset
  }

  if ('tags' in extras) {
    extras.tags?.forEach((tag, idx) => {
      parts.push(<TagChip key={`tag${idx}`} tag={tag}/>)
    })
    delete extras.tags
  }

  if (Object.keys(extras).length) {
    throw new Error(`Unable to figure out how to display transaction extras "${Object.keys(extras).join('", "')}".`)
  }

  return (
    <TableRow>
      <TableCell className="tx"></TableCell>
      <TableCell className="tx"></TableCell>
      <TableCell className="tx extras">{parts}</TableCell>
      <TableCell className="tx"></TableCell>
      <TableCell className="tx"></TableCell>
    </TableRow>
  )
}
