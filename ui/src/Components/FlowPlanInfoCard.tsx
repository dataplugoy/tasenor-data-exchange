import React, { useState } from 'react'
import { Box, Button, Card, CardContent, CardHeader, CircularProgress, Typography } from '@mui/material'
import { Trans } from 'react-i18next'
import { Air, PlayArrow } from '@mui/icons-material'
import { FlowPlan } from '../Types/API/FlowPlan'
import { Project } from '../Types/API/Project'
import { useGET } from '../Hooks/useNet'
import { signalBatchUpdate } from '../Signals/updates'
import { isAlert } from '../Types/isAlert'

interface FlowPlanInfoProps {
  plan: FlowPlan
  project: Project
  button: 'run' | 'retry'
}

export const FlowPlanInfo = (props: FlowPlanInfoProps): React.JSX.Element => {
  const { plan, project, button } = props
  const [running, setRunning] = useState(false)
  const GET = useGET()

  const onRun = async () => {
    setRunning(true)
    const res = await GET(`/flow-plans/${plan.id}/run`)
    setRunning(false)
    if (isAlert(res)) {
      alert('TODO: Upload a file.')
    } else {
      signalBatchUpdate()
    }
  }

  return (
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
  )
}
