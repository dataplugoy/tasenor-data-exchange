import React, { useEffect, useState } from 'react'
import { Box, IconButton, Typography } from '@mui/material'
import { Trans } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { FlowPlanResponse } from '../Types/API/flow-plans/FlowPlanResponse'
import { useGET } from '../Hooks/useNet'
import { Setup } from '../Types/API/Setup'
import { OutputDestination } from '../Types/API/OutputDestination'
import { InputSource } from '../Types/API/InputSource'
import { Clear } from '@mui/icons-material'
import { AccountEditorCard } from '../Components/AccountEditorCard'
import { AccountGroupingCard } from '../Components/AccountGroupingCard'

export const EditSettingsPage = (): React.JSX.Element => {
  const params = useParams()
  const navigate = useNavigate()
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
    <Typography variant="h1" sx={{ display: 'inline-block' }}>
      <IconButton sx={{ mt: -0.8 }} onClick={() => navigate('/settings')}><Clear/></IconButton> <Trans>Edit Settings</Trans>
    </Typography>

    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
      {setup && output && <AccountEditorCard setup={setup} output={output}/>}
      {setup && output && <AccountGroupingCard setup={setup} output={output}/>}
      <Box>
        <pre>
        {JSON.stringify(input, null, 2)}
        </pre>
      </Box>
      <Box>
        <pre>
        {JSON.stringify(output, null, 2)}
        </pre>
      </Box>
    </Box>

  </Box>
}
