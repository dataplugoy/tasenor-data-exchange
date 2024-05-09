import React, { useEffect, useState } from 'react'
import { Box, Button, Card, CardContent, CardHeader, CircularProgress, Typography } from '@mui/material'
import { Trans, useTranslation } from 'react-i18next'
import { Air, PlayArrow, Savings } from '@mui/icons-material'
import { FlowPlan } from '../Types/API/FlowPlan'
import { Project } from '../Types/API/Project'
import { useGET } from '../Hooks/useNet'
import { signalBatchUpdate } from '../Signals/updates'
import { isAlert } from '../Types/isAlert'
import { FileUploader } from './FileUploader'
import { Setup } from '../Types/API/Setup'
import { OutputDestination } from '../Types/API/OutputDestination'

interface AccountEditorCardProps {
  setup: Setup
  output: OutputDestination
}

export const AccountEditorCard = (props: AccountEditorCardProps): React.JSX.Element => {
  const { setup, output } = props
  const GET = useGET<unknown[]>()

  useEffect(() => {
    GET(`/output-destinations/${output.id}/accounts`).then(res => {
      console.log(res);
    })
  }, [])

  return (
    <Card>
      <CardHeader
        avatar={<Savings sx={{ color: 'secondary.main', backgroundColor: 'secondary.contrastText' }}/>}
        title={<Typography variant="subtitle1"><Trans>Account Mapping</Trans></Typography>}
      />
      <CardContent>
        {JSON.stringify(setup.accounts)}
      </CardContent>
    </Card>
  )
}
