import React, { useEffect, useState } from 'react'
import { Autocomplete, Box, Card, CardContent, CardHeader, CircularProgress, TextField, Typography } from '@mui/material'
import { Trans, useTranslation } from 'react-i18next'
import { Savings } from '@mui/icons-material'
import { useGET } from '../Hooks/useNet'
import { Setup } from '../Types/API/Setup'
import { OutputDestination } from '../Types/API/OutputDestination'
import { RemoteAccount } from '../Types/API/RemoteAccount'
import { AccountNumber } from '@tasenor/common'
import { Account } from '../Types/API/Account'

interface AccountDescriptionProps {
  code: Account
}

const AccountDescription = (props: AccountDescriptionProps): React.JSX.Element => {
  const { t } = useTranslation()
  const { code } = props
  let text = code
  if (/^CURRENCY_/.test(code)) {
    text = t('CURRENCY_ACCOUNT', { currency: code.substring(9)})
  }
  return <Box component="span">{text}</Box>
}

interface AccountEditProps {
  code: Account
  remote?: RemoteAccount
  options: RemoteAccount[]
}

const AccountEdit = (props: AccountEditProps): React.JSX.Element => {
  const { code, remote, options } = props

  return <Autocomplete
    options={options}
    getOptionLabel={(option) => `${option.number} ${option.name}`}
    value={remote}
    renderInput={(params) => (
      <TextField
        {...params}
        label={<AccountDescription code={code}/>}
        inputProps={{
          ...params.inputProps,
          autoComplete: 'off'
        }}
      />
    )}
  />
}

interface AccountEditorCardProps {
  setup: Setup
  output: OutputDestination
}

export const AccountEditorCard = (props: AccountEditorCardProps): React.JSX.Element => {
  const { setup, output } = props
  const GET = useGET<RemoteAccount[]>()
  const [remotes, setRemotes] = useState<Record<AccountNumber, RemoteAccount>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    GET(`/output-destinations/${output.id}/accounts`).then(res => {
      res && setRemotes(res.reduce((prev, cur) => ({ ...prev, [cur.number]: cur }), {}))
      setLoading(false)
    })
  }, [])

  const accounts: Record<AccountNumber, RemoteAccount> = setup.accounts as Record<AccountNumber, RemoteAccount> || {}

  return (
    <Card>
      <CardHeader
        avatar={<Savings sx={{ color: 'secondary.main', backgroundColor: 'secondary.contrastText' }}/>}
        title={<Typography variant="subtitle1"><Trans>Account Mapping</Trans></Typography>}
      />
      <CardContent>
        {
          loading && <CircularProgress color="secondary" size={40}/>
        }
        {
          !loading && Object.keys(accounts).map(code => (
            <Box sx={{ my: 1.5 }} key={code}>
              <AccountEdit code={code} remote={remotes[accounts[code]]} options={Object.values(remotes)}/>
            </Box>
          ))
        }
      </CardContent>
    </Card>
  )
}
