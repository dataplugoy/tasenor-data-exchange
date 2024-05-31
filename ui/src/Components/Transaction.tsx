import React from 'react'
import { Transaction as APITransaction, TransactionLine as APITransactionLine } from '../Types/API/Transaction'
import { DateTime } from 'luxon'
import { TransactionDeliveryLine, TransactionLine } from './TransactionLine'
import { OutputItem } from '../Types/API/OutputItem'
import { isOutputItem } from '../Types/predicates'
import { OutputDestination } from '../Types/API/OutputDestination'

interface TransactionProps {
  tx: APITransaction | OutputItem
  output?: OutputDestination
}

export const Transaction = (props: TransactionProps): React.JSX.Element => {
  let tx: APITransaction
  let out: OutputItem | null = null

  if (isOutputItem(props.tx)) {
    tx = props.tx.data
    out = props.tx
  } else {
    tx = props.tx
  }

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
      {
        out && props.output && <TransactionDeliveryLine tx={out} output={props.output}/>
      }
    </>
  )
}
