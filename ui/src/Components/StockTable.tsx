import { Box, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Button, TextField } from '@mui/material'
import React, { useState } from 'react'
import { Trans } from 'react-i18next'
import { StockData } from '../Types/API/StockData'
import { Currency, Language } from '@tasenor/common'
import { money } from '../Helpers/stringify'
import { Cancel, Edit } from '@mui/icons-material'

interface StockTableProps {
  stock: StockData
  footer: string
  language: Language
  currency: Currency
  onSave?: (stock: StockData) => Promise<void>
}

export const StockTable = (props: StockTableProps): React.JSX.Element => {

  const [editing, setEditing] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const { stock, footer, language, currency, onSave } = props

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
                {!editing &&
                  <TableCell align="right">
                    {stock[acc][ticker].amount}
                  </TableCell>
                }
                {editing &&
                  <TableCell>
                    <TextField size="small" sx={{ width: '5rem' }}
                      value={stock[acc][ticker].amount}
                      onChange={e => {
                        stock[acc][ticker].amount = e.target.value
                        setRefresh(refresh + 1)
                      }}
                      onBlur={() => {
                        stock[acc][ticker].amount = parseFloat(stock[acc][ticker].amount)
                        if (isNaN(stock[acc][ticker].amount)) {
                          stock[acc][ticker].amount = 0
                        }
                        setRefresh(refresh + 1)
                      }}
                    />
                  </TableCell>
                }
                {!editing &&
                  <TableCell align="right">
                    {money(stock[acc][ticker].value, currency, language)}
                  </TableCell>
                }
                {
                  editing &&
                    <TableCell>
                      <TextField size="small" sx={{ width: '8rem' }}
                        value={stock[acc][ticker].value}
                        onChange={e => {
                          stock[acc][ticker].value = e.target.value
                          setRefresh(refresh + 1)
                        }}
                        onBlur={() => {
                          stock[acc][ticker].value = parseFloat(stock[acc][ticker].value)
                          if (isNaN(stock[acc][ticker].value)) {
                            stock[acc][ticker].value = 0
                          }
                          setRefresh(refresh + 1)
                        }}
                      />
                    </TableCell>
                }

                <TableCell align="right">{stock[acc][ticker].amount ? money(stock[acc][ticker].value / stock[acc][ticker].amount, currency, language) : <>&mdash;</>}</TableCell>
              </TableRow>
            ))
          }
        </TableBody>
      </Table>

      <Box sx={{ mt: 1 }}>
        {!editing && footer}
        {editing && onSave &&
          <Button variant="outlined" onClick={() => { onSave(stock).then(() => setEditing(false)) }}>
            <Trans>Save</Trans>
          </Button>
        }
      </Box>
    </Box>
  )
}
