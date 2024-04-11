import React, { useEffect, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { Trans } from 'react-i18next'
import { useGET } from '../Hooks/useNet'
import { useParams } from 'react-router-dom'
import { FlowPlanResponse } from '../Types/API/flow-plans/FlowPlanResponse'
import { Project } from '../Types/API/Project'
import { FlowPlan } from '../Types/API/FlowPlan'
import { Batch } from '../Types/API/Batch'

export const FlowPlanPage = (): React.JSX.Element => {
  const GET = useGET<FlowPlanResponse>()
  const { id } = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [flowPlan, setFlowPlan] = useState<FlowPlan | null>(null)
  const [batches, setBatches] = useState<Batch[]>([])

  useEffect(() => {
    GET(`/flow-plans/${id}`).then(res => {
      res && res.project && setProject(res.project)
      res && setFlowPlan(res)
      res && res.bacthes && setBatches(res.bacthes)
    })

  }, [])

  return (
    <Box>
      <Typography variant="h1">
        <Trans>Data Flow Plan</Trans>
      </Typography>
      <Box>
        {JSON.stringify(project)}
      </Box>
      <br/>
      <Box>
        {JSON.stringify(flowPlan)}
      </Box>
      <br/>
      <Box>
        {JSON.stringify(batches)}
      </Box>
    </Box>
  )
}
