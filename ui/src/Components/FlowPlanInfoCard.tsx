import React, { useState } from 'react'
import { Box, Button, Card, CardContent, CardHeader, CircularProgress, Typography } from '@mui/material'
import { Trans, useTranslation } from 'react-i18next'
import { Air, PlayArrow } from '@mui/icons-material'
import { FlowPlan } from '../Types/API/FlowPlan'
import { Project } from '../Types/API/Project'
import { useGET } from '../Hooks/useNet'
import { signalBatchUpdate, signalRunUpdate } from '../Signals/updates'
import { getAlert, isAlert } from '../Types/alerts'
import { FileUploader } from './FileUploader'

interface FlowPlanInfoProps {
  plan: FlowPlan
  project: Project
  button: 'run' | 'retry'
}

export const FlowPlanInfo = (props: FlowPlanInfoProps): React.JSX.Element => {
  const { plan, project, button } = props
  const [running, setRunning] = useState(false)
  const GET = useGET()
  const [text, setText] = useState('')
  const [uploadUrl, setUploadUrl] = useState('')
  const { t } = useTranslation()

  const onRun = async () => {

    setRunning(true)
    const interval = setInterval(signalRunUpdate, 1000)
    const res = await GET(`/flow-plans/${plan.id}/run`)
    clearInterval(interval)
    setRunning(false)

    if (isAlert(res)) {
      // Perhaps make alert handler doing the most. Pass onUploadCancel and onUploadSuccess among other things.
      // Implement toggle query first.
      if (res.type === 'UPLOAD_REQUIRED') {
        setText(res.payload)
        setUploadUrl(res.url)
      } else {
        // TODO: Handle.
        console.log(getAlert(res));
      }
    } else {
      signalBatchUpdate()
    }
  }

  const onUploadCancel = async () => {
    setText('')
    signalBatchUpdate()
  }

  const onUploadSuccess = async () => {
    setText('')
    signalBatchUpdate()
  }

  return (
    <>
      <FileUploader onCancel={onUploadCancel} onSuccess={onUploadSuccess} visible={!!text} text={text} url={uploadUrl} title={t('Upload a File')}/>

      <Card>
        <CardHeader
          avatar={<Air sx={{ color: 'secondary.main', backgroundColor: 'secondary.contrastText' }}/>}
          title={<Typography variant="subtitle1"><Trans>Data Flow Plan</Trans>: {plan.title}</Typography>}
        />
        <CardContent sx={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <Box>
            <Button
              sx={{ backgroundColor: 'secondary.main', color: 'secondary.contrastText' }}
              variant="outlined"
              onClick={onRun}
              disabled={running}
            >
              {button === 'retry' ? <Trans>Retry</Trans> : <Trans>Run</Trans>}
              {running ? <CircularProgress sx={{ ml: '0.2rem' }}color="primary" size={'1rem'}/> : <PlayArrow/> }
            </Button>
          </Box>
          <Box>
            <Typography variant="subtitle1"><Trans>Project</Trans>: {project.name}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1"><Trans>Currency</Trans>: {project.settings?.currency}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1"><Trans>Language</Trans>: {project.settings?.language}</Typography>
          </Box>
        </CardContent>
      </Card>
    </>
  )
}
