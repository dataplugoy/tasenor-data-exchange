import React, { useEffect } from 'react'
import { useApp } from '../Hooks/useApp'
import { useNavigate } from 'react-router-dom'
import { Box, Typography } from '@mui/material'
import { Trans } from 'react-i18next'

export const FlowPlanPage = (): React.JSX.Element => {
  const app = useApp()
  const navigate = useNavigate()

  useEffect(() => {
  }, [])

  return (
    <Box>
      <Typography variant="h1">
        <Trans>Data Flow Plan</Trans>
      </Typography>
    </Box>
  )
}
