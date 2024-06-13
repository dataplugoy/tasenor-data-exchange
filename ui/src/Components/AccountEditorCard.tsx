import React, { useEffect, useState } from 'react'
import { Autocomplete, Box, Button, Card, CardContent, CardHeader, CircularProgress, TextField, Typography } from '@mui/material'
import { Trans, useTranslation } from 'react-i18next'
import { Map } from '@mui/icons-material'
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
    text = t('ACCOUNT_CURRENCY', { currency: code.substring(9) })
  }
  if (/^EXTERNAL_NORDNET_/.test(code)) {
    text = t('ACCOUNT_NORDNET', { currency: code.substring(17) })
  }
  if (/^CRYPTO_/.test(code)) {
    text = t('ACCOUNT_CRYPTO', { currency: code.substring(7) })
  }
  if (/^PROFIT_/.test(code)) {
    text = t('ACCOUNT_PROFIT', { currency: code.substring(7) })
  }
  if (!/_/.test(code)) {
    text = t(`ACCOUNT_${code}`)
  }
  return <Box component="span">{text}</Box>
}

interface AccountEditProps {
  code: Account
  remote?: RemoteAccount
  options: RemoteAccount[]
  onChange: (acc: AccountNumber | null) => void
}

export const AccountEdit = (props: AccountEditProps): React.JSX.Element => {
  const { code, remote, options, onChange } = props
  const none = { number: '', name: '' }
  const scores: Record<AccountNumber, number> = {}

  // Calculate scores from hints.
  options.forEach(option => {
    scores[option.number] = 0
    if (!option.hints || option.hints.length === 0) {
      scores[option.number] = -1
    } else if (option.hints.includes(code)) {
      scores[option.number] += 2
    } else {
      const re = /^(.+?)_/.exec(code)
      if (re && (option.hints || []).includes(re[1])) {
        scores[option.number] += 1
      } else {
        scores[option.number] -= 2
      }
    }
  })

  // Sort by scores and then by number.
  options.sort((a, b) => scores[a.number] !== scores[b.number] ? (scores[b.number] - scores[a.number]) : 0)

  return <Autocomplete
    options={[none].concat(options)}
    getOptionLabel={(option) => option.number === '' && option.name === '' ? '' : `${option.number} ${option.name}`}
    value={remote || none}
    onChange={(_, value) => onChange(value && value.number !== '' ? value.number as AccountNumber : null)}
    isOptionEqualToValue={(a, b) => a.number === b.number}
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
  hasRemoteAccounts: boolean
  onSave: (update: Partial<Setup>) => void
}

export const AccountEditorCard = (props: AccountEditorCardProps): React.JSX.Element => {
  const { setup, output, hasRemoteAccounts } = props
  const GET = useGET<RemoteAccount[]>()
  const [remotes, setRemotes] = useState<Record<AccountNumber, RemoteAccount>>({})
  const [loading, setLoading] = useState(true)
  const [accounts, setAccounts] = useState<Record<Account, AccountNumber>>(setup.accounts as Record<Account, AccountNumber> || {})

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
    props.onSave({ accounts })
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
            <Button disabled={loading} onClick={onSave}><Trans>Save</Trans></Button>
        }

      </CardContent>
    </Card>
  )
}
