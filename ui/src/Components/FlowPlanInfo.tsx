import React, { } from 'react'
import { Card, CardContent, CardHeader, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { Trans } from 'react-i18next'
import { Air } from '@mui/icons-material'
import { FlowPlan } from '../Types/API/FlowPlan'
import { useNavigate } from 'react-router-dom'
import { Project } from '../Types/API/Project'

interface FlowPlanInfoProps {
  plan: FlowPlan
  project: Project
}

export const FlowPlanInfo = (props: FlowPlanInfoProps): React.JSX.Element => {
  const { plan, project } = props

  return (
    <Card>
      <CardHeader
        avatar={<Air sx={{ color: 'secondary.main', backgroundColor: 'secondary.contrastText' }}/>}
        title={<Typography variant="subtitle1"><Trans>Data Flow Plan</Trans>: {plan.title}</Typography>}
      />
      <CardContent>
      <Typography variant="subtitle1"><Trans>Project</Trans>: {project.name}</Typography>
      <Typography variant="subtitle1"><Trans>Currency</Trans>: {project.settings?.currency}</Typography>
      <Typography variant="subtitle1"><Trans>Language</Trans>: {project.settings?.language}</Typography>
      </CardContent>
    </Card>
  )
}
