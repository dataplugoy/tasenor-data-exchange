import React, { } from 'react'
import { Box, Typography } from '@mui/material'
import { Trans } from 'react-i18next'
import { FlowPlanSelector } from '../Components/FlowPlanSelector'

export const SettingsPage = (): React.JSX.Element => {

  return <Box>
    <Typography variant="h1">
      <Trans>Settings</Trans>
    </Typography>
    <Box sx={{ mt: 2 }}>
      <FlowPlanSelector />
    </Box>
  </Box>
}
