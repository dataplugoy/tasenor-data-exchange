import React, { useEffect, useState } from 'react'
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, IconButton, Typography } from '@mui/material'
import { Trans, useTranslation } from 'react-i18next'
import { useGET } from '../Hooks/useNet'
import { useNavigate, useParams } from 'react-router-dom'
import { FlowPlanResponse } from '../Types/API/flow-plans/FlowPlanResponse'
import { Project } from '../Types/API/Project'
import { FlowPlan } from '../Types/API/FlowPlan'
import { Batch } from '../Types/API/Batch'
import { FlowPlanInfo } from '../Components/FlowPlanInfoCard'
import { Clear, ExpandMore } from '@mui/icons-material'
import { BatchBrogressBar } from '../Components/BatchProgressBar'
import { RunList } from '../Components/RunList'
import { whenBatchDeleted, whenBatchUpdates } from '../Signals/updates'
import { useApp } from '../Hooks/useApp'
import { datetime2str } from '../Helpers/stringify'
import { Language, Timestring } from '@tasenor/common'

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
  const navigate = useNavigate()
  const app = useApp()
  const { language } = app.project.settings

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
    whenBatchDeleted(updateFlowPlan)
  }, [])

  return (
    <Box>
      <Typography variant="h1" sx={{ display: 'inline-block' }}>
        <IconButton sx={{ mt: -0.8 }} onClick={() => navigate('/flow-plans')}><Clear/></IconButton> <Trans>Data Flow Plan</Trans>
      </Typography>

      {
        flowPlan && project && <Box sx={{ mt: 2 }}>
          <FlowPlanInfo plan={flowPlan} project={project} batchId={batches.length ? batches[0].id : null} isCompleted={isCompleted}/>
        </Box>
      }

      <Box sx={{ mt: 2 }}>
        { batches.map((batch, idx) => (
          <Accordion data-cy={`Batch-#${batch.number}`} key={batch.id} slotProps={{ transition: { unmountOnExit: true } }}>
            <AccordionSummary expandIcon={<ExpandMore/>}>
              <Box sx={{ width: '100%', display: 'grid', gridTemplateColumns: '5% 30% 60% 5%' }}>
                <Box sx={{ display: 'inline-block', fontWeight: 'bold' }}>#{batch.number}</Box>
                <Box sx={{ display: 'inline-block' }}>
                  {datetime2str(batch.updated as Timestring, language as Language)}
                </Box>
                <Box sx={{ display: 'inline-block' }}>
                  <BatchBrogressBar state={batch.state}/>
                </Box>
                <Box data-cy="output" sx={{ textAlign: 'center', fontWeight: 'bold', color: 'secondary.light' }}>{batch.outputDeliveredCount || ''}</Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <RunList batch={batch}/>
              <Button sx={{ mt: 2 }} disabled={idx > 0} variant="outlined" color="error"><Trans>Rollback</Trans></Button>
            </AccordionDetails>
          </Accordion>))
        }
      </Box>
    </Box>
  )
}
