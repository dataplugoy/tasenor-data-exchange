import React from 'react'
import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material'
import { Transaction as APITransaction } from '../Types/API/Transaction'
import { Trans } from 'react-i18next'
import { Transaction } from './Transaction'
import { OutputItem } from '../Types/API/OutputItem'
import { OutputDestination } from '../Types/API/OutputDestination'

export const TRANSACTION_COLUMNS = 5

interface TransactionTableProps {
  txs: APITransaction[] | OutputItem[]
  output?: OutputDestination | null
}

export const TransactionTable = (props: TransactionTableProps): React.JSX.Element => {
  const { txs, output } = props

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
        {
          txs.map((tx: APITransaction | OutputItem, idx: number) => <Transaction key={idx} tx={tx} output={output}/>)
        }
        {
          txs.length === 0 &&
          <TableRow>
            <TableCell className="tx"/>
            <TableCell className="tx" colSpan={TRANSACTION_COLUMNS - 2}><Trans>No transactions</Trans></TableCell>
          </TableRow>
        }
      </TableBody>
    </Table>
  )
}
