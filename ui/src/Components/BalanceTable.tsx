import { Box, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material'
import React from 'react'
import { Trans } from 'react-i18next'
import { BalanceData } from '../Types/API/BalanceData'
import { Currency, Language } from '@tasenor/common'
import { money } from '../Helpers/stringify'

interface BalanceTableProps {
  balance: BalanceData
  footer: string
  language: Language
  currency: Currency
}

export const BalanceTable = (props: BalanceTableProps): React.JSX.Element => {

  const { balance, footer, language, currency } = props

  return (
    <Box sx={{ minWidth: '25rem' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell variant="head"><Trans>Account</Trans></TableCell>
            <TableCell variant="head" align="right"><Trans>Balance</Trans></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {
            Object.keys(balance).length === 0 &&
            <TableRow>
              <TableCell colSpan={3}>
                <Trans>No transactions</Trans>
              </TableCell>
            </TableRow>
          }
          {
            Object.keys(balance).map(acc =>
              <TableRow key={acc}>
                <TableCell>{acc}</TableCell>
                <TableCell align="right">{money(balance[acc], currency, language)}</TableCell>
              </TableRow>
            )
          }
        </TableBody>
      </Table>
      <Box sx={{ mt: 1 }}>{footer}</Box>
    </Box>
  )
}
