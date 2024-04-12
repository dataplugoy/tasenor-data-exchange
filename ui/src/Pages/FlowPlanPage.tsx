import React, { useEffect, useState } from 'react'
import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from '@mui/material'
import { Trans } from 'react-i18next'
import { useGET } from '../Hooks/useNet'
import { useParams } from 'react-router-dom'
import { FlowPlanResponse } from '../Types/API/flow-plans/FlowPlanResponse'
import { Project } from '../Types/API/Project'
import { FlowPlan } from '../Types/API/FlowPlan'
import { Batch } from '../Types/API/Batch'
import { FlowPlanInfo } from '../Components/FlowPlanInfo'
import { ExpandMore } from '@mui/icons-material'
import { BatchBrogressBar } from '../Components/BatchProgressBar'
import { DateTime } from 'luxon'
import { RunList } from '../Components/RunList'

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
      res && res.batches && setBatches(res.batches)
    })
  }, [])

  // TODO: not expanded by default

  return (
    <Box>
      <Typography variant="h1">
        <Trans>Data Flow Plan</Trans>
      </Typography>
      {
        flowPlan && project && <Box sx={{ mt: 2 }}>
          <FlowPlanInfo plan={flowPlan} project={project}/>
        </Box>
      }
      <Box sx={{ mt: 2 }}>
        { batches.map(batch => <Accordion defaultExpanded key={batch.id} slotProps={{ transition: { unmountOnExit: true } }}>
          <AccordionSummary expandIcon={<ExpandMore/>}>
            <Box sx={{ width: '100%' }}>
              <Box sx={{ display: 'inline-block', width: '8%', fontWeight: 'bold' }}>#{batch.number}</Box>
              <Box sx={{ display: 'inline-block', width: '25%' }}>
                {DateTime.fromISO(batch.updated as string).toLocaleString(DateTime.DATETIME_FULL)}
              </Box>
              <Box sx={{ display: 'inline-block', width: '60%', mb: '-3px' }}>
                <BatchBrogressBar state={batch.state}/>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <RunList batch={batch}/>
          </AccordionDetails>
        </Accordion>)}
      </Box>
    </Box>
  )
}
