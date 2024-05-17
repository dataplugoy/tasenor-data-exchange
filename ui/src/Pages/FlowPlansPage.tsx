import React, { } from 'react'
import { Box, Typography } from '@mui/material'
import { Trans } from 'react-i18next'
import { FlowPlanSelector } from '../Components/FlowPlanSelector'

export const FlowPlansPage = (): React.JSX.Element => {

  return <Box>
    <Typography variant="h1">
      <Trans>Data Flow Plans</Trans>
    </Typography>
    <Box sx={{ mt: 2 }}>
      <FlowPlanSelector />
    </Box>
  </Box>
}
