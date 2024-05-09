import React, {  } from 'react'
import { useApp } from '../Hooks/useApp'
import { Box, Typography } from '@mui/material'
import { Trans } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { FlowPlanSelector } from '../Components/FlowPlanSelector'

export const SettingsPage = (): React.JSX.Element => {
  const app = useApp()
  const params = useParams()

  return <Box>
    <Typography variant="h1">
      <Trans>Settings</Trans>
    </Typography>
    <Box sx={{ mt: 2 }}>
      <FlowPlanSelector />
    </Box>
  </Box>
}
