import React from 'react'
import { Card, CardContent, CardHeader, Typography } from '@mui/material'
import { Setup } from '../Types/API/Setup'
import { Trans, useTranslation } from 'react-i18next'
import { Settings } from '@mui/icons-material'
import { OutputDestination } from '../Types/API/OutputDestination'
import { useApp } from '../Hooks/useApp'
import { usePATCH } from '../Hooks/useNet'

interface SetupCardProps {
  setup: Setup
  output: OutputDestination
}

export const SetupCard = (props: SetupCardProps): React.JSX.Element => {

  const { setup, output } = props
  const settings = setup.settings || {}
  const app = useApp()
  const PATCH = usePATCH<OutputDestination>()
  const { t } = useTranslation()

  const onSave = (changes: Record<string, unknown>): void => {
    PATCH(`/output-destinations/${output.id}/settings`, changes).then(res => {
      if (res) app.addInfo(t('Bookkeeper settings saved'))
    })
  }

  return <Card>
    <CardHeader
      avatar={<Settings sx={{ color: 'secondary.main', backgroundColor: 'secondary.contrastText' }}/>}
      title={<Typography variant="subtitle1"><Trans>Flow Plan Setup</Trans></Typography>}
    />
    <CardContent>
      <pre>
      {JSON.stringify(settings,null,2)}
      </pre>
    </CardContent>
  </Card>
}
