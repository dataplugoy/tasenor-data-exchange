import React, { useEffect, useState } from 'react'
import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from '@mui/material'
import { Trans } from 'react-i18next'
import { useGET } from '../Hooks/useNet'
import { useParams } from 'react-router-dom'
import { FlowPlanResponse } from '../Types/API/flow-plans/FlowPlanResponse'
import { Project } from '../Types/API/Project'
import { FlowPlan } from '../Types/API/FlowPlan'
import { Batch } from '../Types/API/Batch'
import { FlowPlanInfo } from '../Components/FlowPlanInfoCard'
import { ExpandMore } from '@mui/icons-material'
import { BatchBrogressBar } from '../Components/BatchProgressBar'
import { DateTime } from 'luxon'
import { RunList } from '../Components/RunList'
import { whenBatchUpdates } from '../Signals/updates'

type BatchWithOutput = Batch & {
  outputDeliveredCount: number
}

export const FlowPlanPage = (): React.JSX.Element => {
  const GET = useGET<FlowPlanResponse>()
  const { id } = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [flowPlan, setFlowPlan] = useState<FlowPlan | null>(null)
  const [batches, setBatches] = useState<BatchWithOutput[]>([])
  const isCompleted = !batches.length || !!batches[0].completed

  const updateFlowPlan = async () => {
    await GET(`/flow-plans/${id}`).then(res => {
      res && res.project && setProject(res.project)
      res && setFlowPlan(res)
      res && res.batches && setBatches(res.batches)
    })
  }

  useEffect(() => {
    updateFlowPlan()
    whenBatchUpdates(updateFlowPlan)
  }, [])

  return (
    <Box>
      <Typography variant="h1">
        <Trans>Data Flow Plan</Trans>
      </Typography>
      {
        flowPlan && project && <Box sx={{ mt: 2 }}>
          <FlowPlanInfo plan={flowPlan} project={project} button={isCompleted ? 'run' : 'retry' }/>
        </Box>
      }
      <Box sx={{ mt: 2 }}>
        { batches.map((batch, idx) => (
          <Accordion data-cy={`Batch-#${batch.number}`} key={batch.id} slotProps={{ transition: { unmountOnExit: true } }}>
            <AccordionSummary expandIcon={<ExpandMore/>}>
              <Box sx={{ width: '100%', display: 'grid', gridTemplateColumns: '5% 30% 60% 5%' }}>
                <Box sx={{ display: 'inline-block', fontWeight: 'bold' }}>#{batch.number}</Box>
                <Box sx={{ display: 'inline-block' }}>
                  {DateTime.fromISO(batch.updated as string).toLocaleString(DateTime.DATETIME_FULL)}
                </Box>
                <Box sx={{ display: 'inline-block' }}>
                  <BatchBrogressBar state={batch.state}/>
                </Box>
                <Box data-cy="output" sx={{ textAlign: 'center', fontWeight: 'bold', color: 'secondary.light' }}>{batch.outputDeliveredCount || ''}</Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <RunList batch={batch}/>
            </AccordionDetails>
          </Accordion>))
        }
      </Box>
    </Box>
  )
}
