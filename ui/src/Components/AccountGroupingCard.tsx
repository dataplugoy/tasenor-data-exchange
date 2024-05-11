import React, { useState } from 'react'
import { Box, Button, Card, CardContent, CardHeader, Checkbox, Typography } from '@mui/material'
import { Setup } from '../Types/API/Setup'
import { OutputDestination } from '../Types/API/OutputDestination'
import * as changeCase from 'change-case'
import { Trans, useTranslation } from 'react-i18next'
import { usePATCH } from '../Hooks/useNet'
import { useApp } from '../Hooks/useApp'
import { Group } from '@mui/icons-material'


interface AccountGroupingToggleProps {
  setup: Setup
  variable: string
  onChange: (variable: string, state: boolean) => void
}

const AccountGroupingToggle = (props: AccountGroupingToggleProps): React.JSX.Element => {
  const { variable, setup } = props
  const { t } = useTranslation()
  const grouping = setup.accountGrouping || {}
  const [checked, setChecked] = useState(!!grouping[variable])
  const onChange = () => {
    props.onChange(variable, !grouping[variable])
    setChecked(!checked)
  }

  return <Box>
    <Checkbox checked={checked} onChange={onChange}/> {t(changeCase.constantCase(`TOGGLE_${variable}`))}
  </Box>
}

interface AccountGroupingCardProps {
  setup: Setup
  output: OutputDestination
}

export const AccountGroupingCard = (props: AccountGroupingCardProps): React.JSX.Element => {
  const { setup, output } = props
  const PATCH = usePATCH<Setup>()
  const app = useApp()
  const { t } = useTranslation()
  const accountGrouping = setup.accountGrouping || {}
  // DRY: Same as account editor card.
  const hasRemoteAccounts = ['TASENOR'].includes(output.type)

  const onChange = (variable: string, state: boolean) => {
    accountGrouping[variable] = state
    setup.accountGrouping = accountGrouping
  }

  // TODO: DRY: Move one component higher and share with AccountEditorCard.
  const onSave = (): void => {
    PATCH(`/flow-plans/${output.flowPlanId}/setup`, { accountGrouping }).then(res => {
      if (res) app.addInfo(t('Flow plan settings saved'))
    })
  }

  return <Card>
    <CardHeader
      avatar={<Group sx={{ color: 'secondary.main', backgroundColor: 'secondary.contrastText' }}/>}
      title={<Typography variant="subtitle1"><Trans>Account Grouping</Trans></Typography>}
    />
    <CardContent>
      <AccountGroupingToggle onChange={onChange} setup={setup} variable="singleFeeAccount"/>
      <AccountGroupingToggle onChange={onChange} setup={setup} variable="singleTaxAccount"/>
      <AccountGroupingToggle onChange={onChange} setup={setup} variable="singleLossAccount"/>
      <AccountGroupingToggle onChange={onChange} setup={setup} variable="singleStockAccount"/>
      <AccountGroupingToggle onChange={onChange} setup={setup} variable="singleCryptoAccount"/>
      <AccountGroupingToggle onChange={onChange} setup={setup} variable="singleIncomeAccount"/>
      <AccountGroupingToggle onChange={onChange} setup={setup} variable="singleProfitAccount"/>
      <AccountGroupingToggle onChange={onChange} setup={setup} variable="singleExpenseAccount"/>
      <AccountGroupingToggle onChange={onChange} setup={setup} variable="singleDividendAccount"/>
      <Button disabled={!hasRemoteAccounts} onClick={onSave}><Trans>Save</Trans></Button>
    </CardContent>
  </Card>
}
