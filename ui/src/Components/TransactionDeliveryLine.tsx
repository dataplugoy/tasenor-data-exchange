import React from 'react'
import { TableCell, TableRow } from '@mui/material'
import { OutputItem } from '../Types/API/OutputItem'
import { Trans } from 'react-i18next'
import { OutputDestination } from '../Types/API/OutputDestination'
import { TransactionRemoteId } from './TransactionRemoteId'

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
