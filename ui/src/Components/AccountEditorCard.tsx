import React, { useEffect } from 'react'
import { Card, CardContent, CardHeader, Typography } from '@mui/material'
import { Trans } from 'react-i18next'
import { Savings } from '@mui/icons-material'
import { useGET } from '../Hooks/useNet'
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
      console.log(res)
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
