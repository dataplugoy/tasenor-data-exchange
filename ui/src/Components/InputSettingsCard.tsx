import React from 'react'
import { Card, CardContent, CardHeader, Typography } from '@mui/material'
import { Setup } from '../Types/API/Setup'
import { Trans } from 'react-i18next'
import { Input } from '@mui/icons-material'
import { InputSource } from '../Types/API/InputSource'

interface InputSettingsCardProps {
  setup: Setup
  input: InputSource
}

export const InputSettingsCard = (props: InputSettingsCardProps): React.JSX.Element => {

  return <Card>
    <CardHeader
      avatar={<Input sx={{ color: 'secondary.main', backgroundColor: 'secondary.contrastText' }}/>}
      title={<Typography variant="subtitle1"><Trans>Data Input Settings</Trans></Typography>}
    />
    <CardContent>
      <Trans>This source does not need any settings.</Trans>
    </CardContent>
  </Card>
}
