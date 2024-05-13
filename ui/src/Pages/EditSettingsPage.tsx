import React, { useEffect, useState } from 'react'
import { Box, IconButton, Typography } from '@mui/material'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { FlowPlanResponse } from '../Types/API/flow-plans/FlowPlanResponse'
import { useGET, usePATCH } from '../Hooks/useNet'
import { Setup } from '../Types/API/Setup'
import { OutputDestination } from '../Types/API/OutputDestination'
import { InputSource } from '../Types/API/InputSource'
import { Clear } from '@mui/icons-material'
import { AccountEditorCard } from '../Components/AccountEditorCard'
import { AccountGroupingCard } from '../Components/AccountGroupingCard'
import { useApp } from '../Hooks/useApp'

export const EditSettingsPage = (): React.JSX.Element => {
  const params = useParams()
  const navigate = useNavigate()
  const GET = useGET<FlowPlanResponse>()
  const PATCH = usePATCH<Setup>()
  const GETInput = useGET<InputSource>()
  const GETOutput = useGET<OutputDestination>()
  const [setup, setSetup] = useState<Setup|null>(null)
  const [output, setOutput] = useState<OutputDestination|null>(null)
  const [input, setInput] = useState<InputSource|null>(null)
  const hasRemoteAccounts = ['TASENOR'].includes(`${output?.type}`)
  const app = useApp()
  const { t } = useTranslation()

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

  const onSave = (changes): void => {
    output && PATCH(`/flow-plans/${output.flowPlanId}/setup`, changes).then(res => {
      if (res) app.addInfo(t('Flow plan settings saved'))
    })
  }

  return <Box>
    <Typography variant="h1" sx={{ display: 'inline-block' }}>
      <IconButton sx={{ mt: -0.8 }} onClick={() => navigate('/settings')}><Clear/></IconButton> <Trans>Edit Settings</Trans>
    </Typography>

    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
      {setup && output && <AccountEditorCard onSave={onSave} hasRemoteAccounts={hasRemoteAccounts} setup={setup} output={output}/>}
      {setup && output && <AccountGroupingCard onSave={onSave} hasRemoteAccounts={hasRemoteAccounts} setup={setup} output={output}/>}
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
