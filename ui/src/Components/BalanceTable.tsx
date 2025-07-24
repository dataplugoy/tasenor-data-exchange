import { Box, Table, TableHead, TableRow, TableCell, TableBody, IconButton, TextField, Button } from '@mui/material'
import React, { useState } from 'react'
import { Trans } from 'react-i18next'
import { BalanceData } from '../Types/API/BalanceData'
import { Currency, Language } from '@tasenor/common'
import { money } from '../Helpers/stringify'
import { Edit, Cancel } from '@mui/icons-material'

interface BalanceTableProps {
  balance: BalanceData
  footer: string
  language: Language
  currency: Currency
  onSave?: (balance: BalanceData) => Promise<void>
}

export const BalanceTable = (props: BalanceTableProps): React.JSX.Element => {

  const { balance, footer, language, currency, onSave } = props
  const [editing, setEditing] = useState(false)
  const [refresh, setRefresh] = useState(0)

  return (
    <Box sx={{ minWidth: '25rem' }}>
      { onSave &&
        <Box>
          {!editing && <IconButton onClick={() => setEditing(true)}><Edit/></IconButton>}
          {editing && <IconButton onClick={() => setEditing(false)}><Cancel/></IconButton>}
        </Box>
      }
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
                {!editing && <TableCell align="right">{money(balance[acc], currency, language)}</TableCell>}
                {editing &&
                  <TableCell align="right">
                    <TextField size="small" sx={{ width: '8rem' }}
                      value={balance[acc]}
                      onChange={e => {
                        balance[acc] = e.target.value as unknown as number // Cheat until blur.
                        setRefresh(refresh + 1)
                      }}
                      onBlur={() => {
                        balance[acc] = parseFloat(`${balance[acc]}`)
                        if (isNaN(balance[acc])) {
                          balance[acc] = 0
                        }
                        setRefresh(refresh + 1)
                      }}
                    />
                  </TableCell>
                }
              </TableRow>
            )
          }
        </TableBody>
      </Table>

      <Box sx={{ mt: 1 }}>
      {!editing && footer}
      {editing && onSave &&
        <Button variant="outlined" onClick={() => { onSave(balance).then(() => setEditing(false)) }}>
          <Trans>Save</Trans>
        </Button>
      }
      </Box>

    </Box>
  )
}
