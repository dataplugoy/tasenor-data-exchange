import React from 'react'
import { Transaction as APITransaction, TransactionLine as APITransactionLine } from '../Types/API/Transaction'
import { DateTime } from 'luxon'
import { TransactionLine } from './TransactionLine'

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
