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
  } else if (/^DEBT_CURRENCY_/.test(code)) {
    text = t('ACCOUNT_DEBT_CURRENCY', { currency: code.substring(14) })
  } else if (/^EXTERNAL_NORDNET_/.test(code)) {
    text = t('ACCOUNT_NORDNET', { currency: code.substring(17) })
  } else if (/^CRYPTO_/.test(code)) {
    text = t('ACCOUNT_CRYPTO', { currency: code.substring(7) })
  } else if (code === 'FOREX_PROFIT' || code === 'FOREX_LOSS') {
    text = t(`ACCOUNT_${code}`)
  } else if (/^PROFIT_/.test(code)) {
    text = t('ACCOUNT_PROFIT', { currency: code.substring(7) })
  } else if (/^FEE_/.test(code)) {
    text = t('ACCOUNT_FEE', { currency: code.substring(4) })
  } else if (/^STOCK_/.test(code)) {
    text = t('ACCOUNT_STOCK', { ticker: code.substring(6) })
  } else if (/^WALLET_/.test(code)) {
    text = t('ACCOUNT_WALLET', { asset: code.substring(7) })
  } else if (/^BANK_/.test(code)) {
    text = t('ACCOUNT_BANK', { account: code.substring(5) })
  } else if (code === 'TRANSFER_INTERNAL') {
    text = t('ACCOUNT_TRANSFER_INTERNAL')
  } else if (/^TAX_/.test(code)) {
    text = t(`ACCOUNT_TAX_${code.substring(4)}`)
  } else if (/^INCOME_/.test(code)) {
    text = t(`ACCOUNT_INCOME_${code.substring(7)}`)
  } else if (/^EXPENSE_/.test(code)) {
    text = t(`ACCOUNT_EXPENSE_${code.substring(8)}`)
  } else if (!/_/.test(code)) {
    text = t(`ACCOUNT_GENERAL_${code}`)
  }

  return <Box component="span">{text}</Box>
}

interface AccountEditProps {
  code: Account
  disabled?: boolean
  remote?: RemoteAccount
  options: RemoteAccount[]
  onChange: (acc: AccountNumber | null) => void
}

export const AccountEdit = (props: AccountEditProps): React.JSX.Element => {
  const { code, remote, options, onChange, disabled } = props
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

  const stars = (num: Account) => {
    return scores[num] > 0 ? ' ⭐' : ''
  }

  return <Autocomplete
    disabled={disabled}
    options={[none].concat(options)}
    getOptionLabel={(option) => option.number === '' && option.name === '' ? '' : `${option.number} ${option.name}${stars(option.number)}`}
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
