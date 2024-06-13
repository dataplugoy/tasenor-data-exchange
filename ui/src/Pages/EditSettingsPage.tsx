import React, { useEffect, useState } from 'react'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Typography } from '@mui/material'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { FlowPlanResponse } from '../Types/API/flow-plans/FlowPlanResponse'
import { useDELETE, useGET, usePATCH } from '../Hooks/useNet'
import { Setup } from '../Types/API/Setup'
import { OutputDestination } from '../Types/API/OutputDestination'
import { InputSource } from '../Types/API/InputSource'
import { Clear, Delete } from '@mui/icons-material'
import { AccountEditorCard } from '../Components/AccountEditorCard'
import { AccountGroupingCard } from '../Components/AccountGroupingCard'
import { useApp } from '../Hooks/useApp'
import { InputSettingsCard } from '../Components/InputSettingsCard'
import { OutputSettingsCard } from '../Components/OutputSettingsCard'
import { SetupCard } from '../Components/SetupCard'

export const EditSettingsPage = (): React.JSX.Element => {
  const params = useParams()
  const navigate = useNavigate()
  const GET = useGET<FlowPlanResponse>()
  const PATCH = usePATCH<Setup>()
  const DELETE = useDELETE()
  const GETInput = useGET<InputSource>()
  const GETOutput = useGET<OutputDestination>()
  const [setup, setSetup] = useState<Setup|null>(null)
  const [output, setOutput] = useState<OutputDestination|null>(null)
  const [input, setInput] = useState<InputSource|null>(null)
  const [deleting, setDeleting] = useState(false)
  const hasRemoteAccounts = ['TASENOR', 'PROCOUNTOR'].includes(`${output?.type}`)
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

  const onDelete = async () => {
    setDeleting(false)
    app.setDimming(true)
    await DELETE(`/flow-plans/${params.id}`)
    app.setDimming(false)
    navigate('/')
  }

  return <Box>
    <Typography variant="h1" sx={{ display: 'inline-block' }}>
      <IconButton sx={{ mt: -0.8 }} onClick={() => navigate('/settings')}><Clear/></IconButton> <Trans>Edit Settings</Trans>
    </Typography>

    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
      {setup && output && <AccountEditorCard onSave={onSave} hasRemoteAccounts={hasRemoteAccounts} setup={setup} output={output}/>}
      {setup && output && <AccountGroupingCard onSave={onSave} hasRemoteAccounts={hasRemoteAccounts} setup={setup} output={output}/>}
      {setup && input && <InputSettingsCard setup={setup} input={input}/>}
      {setup && output && <OutputSettingsCard setup={setup} output={output}/>}
      {setup && output && <SetupCard setup={setup} output={output}/>}
    </Box>

    <Box sx={{ mt: 3 }}>
      <Button color="error" variant="text" onClick={() => setDeleting(true)} startIcon={<Delete/>}>Delete This Flow Plan</Button>
    </Box>

    <Dialog open={deleting} fullWidth>
      <DialogTitle>Deleting the Flow Plan</DialogTitle>

      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          <Trans>This does not delete possible transactions created on any remote site.</Trans><> </>
          <Trans>However, all data and history will be deleted from this site.</Trans><> </>
          <Box component="span" sx={{ fontWeight: 'bold' }}>
            <Trans sx={{}}>Are You sure?</Trans>
          </Box>
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button data-cy="DialogButton-Cancel" variant="outlined" onClick={() => setDeleting(false)}><Trans>Cancel</Trans></Button>
        <Button data-cy="DialogButton-Delete" onClick={onDelete}><Trans>Delete</Trans></Button>
      </DialogActions>
    </Dialog>

  </Box>
}
