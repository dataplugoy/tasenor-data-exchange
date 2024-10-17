import { Box, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material'
import React from 'react'
import { Trans } from 'react-i18next'
import { StockData } from '../Types/API/StockData'
import { sprintf } from 'sprintf-js'

interface StockTableProps {
  stock: StockData
  footer: string
}

export const StockTable = (props: StockTableProps): React.JSX.Element => {

  const { stock, footer } = props

  return (
    <Box sx={{ minWidth: '25rem' }}>
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell variant="head"><Trans>Account</Trans></TableCell>
          <TableCell variant="head"><Trans>Asset</Trans></TableCell>
          <TableCell variant="head" align="right"><Trans>Units</Trans></TableCell>
          <TableCell variant="head" align="right"><Trans>Value</Trans></TableCell>
          <TableCell variant="head" align="right"><Trans>Unit Value</Trans></TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {
          Object.keys(stock).length === 0 &&
          <TableRow>
            <TableCell colSpan={5}>
              <Trans>No assets</Trans>
            </TableCell>
          </TableRow>
        }
        {
          Object.keys(stock).map((acc, idx) => Object.keys(stock[acc]).map(ticker =>
            <TableRow key={`${acc}+${ticker}`}>
              <TableCell>{acc}</TableCell>
              <TableCell>{ticker}</TableCell>
              <TableCell align="right">{stock[acc][ticker].amount}</TableCell>
              <TableCell align="right">{stock[acc][ticker].value}</TableCell>
              <TableCell align="right">{stock[acc][ticker].amount ? sprintf('%.2f', stock[acc][ticker].value / stock[acc][ticker].amount) : <>&mdash;</>}</TableCell>
            </TableRow>
          ))
        }
      </TableBody>
    </Table>
    <Box sx={{ mt: 1 }}>{footer}</Box>
  </Box>
  )
}
