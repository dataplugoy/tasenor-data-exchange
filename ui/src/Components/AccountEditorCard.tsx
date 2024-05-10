import React, { useEffect, useState } from 'react'
import { Autocomplete, Box, Button, Card, CardContent, CardHeader, CircularProgress, TextField, Typography } from '@mui/material'
import { Trans, useTranslation } from 'react-i18next'
import { Map } from '@mui/icons-material'
import { useGET, usePATCH } from '../Hooks/useNet'
import { Setup } from '../Types/API/Setup'
import { OutputDestination } from '../Types/API/OutputDestination'
import { RemoteAccount } from '../Types/API/RemoteAccount'
import { AccountNumber } from '@tasenor/common'
import { Account } from '../Types/API/Account'
import { useApp } from '../Hooks/useApp'

interface AccountDescriptionProps {
  code: Account
}

const AccountDescription = (props: AccountDescriptionProps): React.JSX.Element => {
  const { t } = useTranslation()
  const { code } = props
  let text = code
  if (/^CURRENCY_/.test(code)) {
    text = t('CURRENCY_ACCOUNT', { currency: code.substring(9) })
  }
  if (/^EXTERNAL_NORDNET_/.test(code)) {
    text = t('NORDNET_ACCOUNT', { currency: code.substring(17) })
  }
  if (!/_/.test(code)) {
    text = t(`${code}_ACCOUNT`)
  }
  return <Box component="span">{text}</Box>
}

interface AccountEditProps {
  code: Account
  remote?: RemoteAccount
  options: RemoteAccount[]
  onChange: (acc: AccountNumber | null) => void
}

const AccountEdit = (props: AccountEditProps): React.JSX.Element => {
  const { code, remote, options, onChange } = props
  const none = { number: '', name: '' }
  // TODO: Sort out remotes according to hints.

  return <Autocomplete
    options={options.concat(none)}
    getOptionLabel={(option) => option.number === '' && option.name === '' ? '' : `${option.number} ${option.name}`}
    value={remote || none}
    onChange={(_, value) => onChange(value && value.number !== '' ? value.number as AccountNumber : null)}
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
  const PATCH = usePATCH<Setup>()
  const app = useApp()
  const { t } = useTranslation()
  const [remotes, setRemotes] = useState<Record<AccountNumber, RemoteAccount>>({})
  const [loading, setLoading] = useState(true)
  const [accounts, setAccounts] = useState<Record<Account, AccountNumber>>(setup.accounts as Record<Account, AccountNumber> || {})

  const hasRemoteAccounts = ['TASENOR'].includes(output.type)

  useEffect(() => {
    if (hasRemoteAccounts) {
      GET(`/output-destinations/${output.id}/accounts`).then(res => {
        res && setRemotes(res.reduce((prev, cur) => ({ ...prev, [cur.number]: cur }), {}))
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [])

  const onChange = (code: Account, number: AccountNumber | null): void => {
    setAccounts({ ...accounts, [code]: number } as Record<Account, AccountNumber>)
  }

  const onSave = (): void => {
    PATCH(`/flow-plans/${output.flowPlanId}/setup`, { accounts }).then(res => {
      if (res) app.addInfo(t('Account configuration saved'))
    })
  }

  return (
    <Card>
      <CardHeader
        avatar={<Map sx={{ color: 'secondary.main', backgroundColor: 'secondary.contrastText' }}/>}
        title={<Typography variant="subtitle1"><Trans>Account Mapping</Trans></Typography>}
      />
      <CardContent>
        {
          loading && <Box><CircularProgress color="secondary" size={40}/></Box>
        }
        {
          !loading && hasRemoteAccounts && Object.keys(accounts).map(code => (
            <Box sx={{ my: 1.5 }} key={code}>
              <AccountEdit
                code={code}
                remote={remotes[accounts[code]]}
                options={Object.values(remotes)}
                onChange={(val) => onChange(code, val)}
              />
            </Box>
          ))
        }
        {
          !hasRemoteAccounts && <Box>
            <Trans>The selected bookkeeping destination does not need account mapping.</Trans>
          </Box>
        }
        {
          hasRemoteAccounts &&
            <Button disabled={loading || !hasRemoteAccounts} onClick={onSave}><Trans>Save</Trans></Button>
        }

      </CardContent>
    </Card>
  )
}
