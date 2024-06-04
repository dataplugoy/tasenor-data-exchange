import React, { useState } from 'react'
import { Box, Button, Card, CardContent, CardHeader, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Typography } from '@mui/material'
import { Trans } from 'react-i18next'
import { Air, PlayArrow } from '@mui/icons-material'
import { FlowPlan } from '../Types/API/FlowPlan'
import { Project } from '../Types/API/Project'
import { useDELETE, useGET } from '../Hooks/useNet'
import { signalBatchDeleted, signalBatchUpdate, signalRunUpdate } from '../Signals/updates'
import { getAlert, isAlert } from '../Types/alerts'
import { UIAlert } from '../Types/Classes/UIAlert'
import { AlertHandler } from './AlertHandler'

interface FlowPlanInfoProps {
  plan: FlowPlan
  project: Project
  batchId: number | null
  isCompleted: boolean
}

export const FlowPlanInfo = (props: FlowPlanInfoProps): React.JSX.Element => {
  const { plan, project, isCompleted, batchId } = props
  const [running, setRunning] = useState(false)
  const [abandoning, setAbandoning] = useState(false)
  const GET = useGET()
  const DELETE = useDELETE()
  const [alert, setAlert] = useState<UIAlert|null>(null)

  const onCancel = () => {
    signalBatchUpdate()
  }

  const onSuccess = (res) => {
    if (isAlert(res)) {
      setAlert(getAlert(res))
      signalBatchUpdate()
    } else {
      signalBatchUpdate()
    }
  }

  const onRun = async () => {
    setAlert(null)
    setRunning(true)
    const interval = setInterval(signalRunUpdate, 1000)
    const res = await GET(`/flow-plans/${plan.id}/run`)
    clearInterval(interval)
    setRunning(false)

    if (isAlert(res)) {
      setAlert(getAlert(res))
    } else {
      signalBatchUpdate()
    }
  }

  const onAbandon = async () => {
    setAbandoning(true)
  }

  const onDelete = async () => {
    setAbandoning(false)
    await DELETE(`/batches/${batchId}`)
    signalBatchDeleted()
  }

  return (
    <>
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
              {isCompleted ? <Trans>Run</Trans> : <Trans>Retry</Trans>}
              {running ? <CircularProgress sx={{ ml: '0.2rem' }}color="primary" size={'1rem'}/> : <PlayArrow/> }
            </Button>

            <Button
              variant="contained"
              disabled={isCompleted || !batchId}
              sx={{ ml: 2, backgroundColor: 'error.dark', color: 'error.contrastText' }}
              onClick={onAbandon}
            >
              <Trans>Abandon</Trans>
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

      {alert && <AlertHandler alert={alert} onCancel={onCancel} onSuccess={onSuccess}/>}

      <Dialog open={abandoning} fullWidth>
        <DialogTitle>Abandon the Latest Batch</DialogTitle>

        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            <Trans>This will remove all data retrieved during the processing.</Trans><> </>
            <Box component="span" sx={{ fontWeight: 'bold' }}>
              <Trans sx={{}}>Are You sure?</Trans>
            </Box>
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button data-cy="DialogButton-Cancel" variant="outlined" onClick={() => setAbandoning(false)}><Trans>Cancel</Trans></Button>
          <Button data-cy="DialogButton-Abandon" onClick={onDelete}><Trans>Delete</Trans></Button>
        </DialogActions>
      </Dialog>

    </>
  )
}
