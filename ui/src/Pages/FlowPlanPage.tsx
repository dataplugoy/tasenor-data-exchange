import React, { useEffect } from 'react'
import { Box, Typography } from '@mui/material'
import { Trans } from 'react-i18next'
import { useGET } from '../Hooks/useNet'
import { useParams } from 'react-router-dom'

export const FlowPlanPage = (): React.JSX.Element => {
  const GET = useGET<{}>()
  const { id } = useParams()

  useEffect(() => {
    GET(`/flow-plans/${id}`).then(res => {
      console.log(res);
    })

  }, [])

  return (
    <Box>
      <Typography variant="h1">
        <Trans>Data Flow Plan</Trans>
      </Typography>
    </Box>
  )
}
