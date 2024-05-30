import React from 'react'
import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material'
import { Transaction as APITransaction } from '../Types/API/Transaction'
import { Trans } from 'react-i18next'
import { Transaction } from './Transaction'

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
