import React, { useEffect, useState } from 'react'
import { Box, Card, CardContent, CardHeader, CircularProgress, Typography } from '@mui/material'
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
  loading?: boolean
  remote?: RemoteAccount
}

const AccountEdit = (props: AccountEditProps): React.JSX.Element => {
  const { code, remote, loading } = props
  return <Box>
    <AccountDescription code={code}/> <br/>
    {remote && remote.number} {remote && remote.name}
    {loading && <CircularProgress color="secondary" size={20}/>}
  </Box>
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
          Object.keys(accounts).map(code => <React.Fragment key={code}>
              <AccountEdit code={code} remote={remotes[accounts[code]]} loading={loading}/>
            </React.Fragment>
          )
        }
      </CardContent>
    </Card>
  )
}
