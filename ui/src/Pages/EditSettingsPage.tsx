import React, { useEffect, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { Trans } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { FlowPlanResponse } from '../Types/API/flow-plans/FlowPlanResponse'
import { useGET } from '../Hooks/useNet'
import { Setup } from '../Types/API/Setup'
import { OutputDestination } from '../Types/API/OutputDestination'
import { InputSource } from '../Types/API/InputSource'

export const EditSettingsPage = (): React.JSX.Element => {
  const params = useParams()
  const GET = useGET<FlowPlanResponse>()
  const GETInput = useGET<InputSource>()
  const GETOutput = useGET<OutputDestination>()
  const [setup, setSetup] = useState<Setup|null>(null)
  const [output, setOutput] = useState<OutputDestination|null>(null)
  const [input, setInput] = useState<InputSource|null>(null)

  useEffect(() => {
    GET(`/flow-plans/${params.id}`).then(res => {
      res && res.setup && setSetup(res.setup)
    })
    GETInput(`/flow-plans/${params.id}/input`).then(res => {
      res && setInput(res)
    })
    GETOutput(`/flow-plans/${params.id}/output`).then(res => {
      res && setOutput(res)
    })
  }, [])

  return <Box>
    <Typography variant="h1">
      <Trans>Edit Settings</Trans>
    </Typography>

    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
      <Box sx={{ mt: 2 }}>
        <pre>
        {JSON.stringify(setup, null, 2)}
        </pre>
      </Box>
      <Box sx={{ mt: 2 }}>
        <pre>
        {JSON.stringify(input, null, 2)}
        </pre>
      </Box>
      <Box sx={{ mt: 2 }}>
        <pre>
        {JSON.stringify(output, null, 2)}
        </pre>
      </Box>
    </Box>

  </Box>
}
