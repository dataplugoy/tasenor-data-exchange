import React, { useEffect, useState } from 'react'
import { useApp } from '../Hooks/useApp'
import { Box, Typography } from '@mui/material'
import { Trans } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { FlowPlanResponse } from '../Types/API/flow-plans/FlowPlanResponse'
import { useGET } from '../Hooks/useNet'
import { Setup } from '../Types/API/Setup'

export const EditSettingsPage = (): React.JSX.Element => {
  const params = useParams()
  const GET = useGET<FlowPlanResponse>()
  const [setup, setSetup] = useState<Setup|null>(null)

  useEffect(() => {
    GET(`/flow-plans/${params.id}`).then(res => {
      res && res.setup && setSetup(res.setup)
    })
  })

  return <Box>
    <Typography variant="h1">
      <Trans>Edit Settings</Trans>
    </Typography>
    <Box sx={{ mt: 2 }}>
      <pre>
      {JSON.stringify(setup, null, 2)}
      </pre>
    </Box>
  </Box>
}
