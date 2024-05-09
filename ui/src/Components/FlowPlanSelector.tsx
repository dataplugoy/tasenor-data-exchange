import React, { useEffect, useState } from 'react'
import { Button, Card, CardContent, CardHeader, Typography } from '@mui/material'
import { Trans } from 'react-i18next'
import { Air } from '@mui/icons-material'
import { useGET } from '../Hooks/useNet'
import { FlowPlansResponse } from '../Types/API/flow-plans/FlowPlansResponse'
import { FlowPlan } from '../Types/API/FlowPlan'
import { useNavigate } from 'react-router-dom'

export const FlowPlanSelector = (): React.JSX.Element => {

  const GET = useGET<FlowPlansResponse>()
  const [plans, setPlans] = useState<FlowPlan[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    GET('/flow-plans').then(res => {
      res && setPlans(res)
    })
  })

  return (
    <>
      <Card>
        <CardHeader
          avatar={<Air sx={{ color: 'secondary.main', backgroundColor: 'secondary.contrastText' }}/>}
          title={<Typography variant="subtitle1"><Trans>Select Flow Plan</Trans></Typography>}
        />
        <CardContent sx={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          {plans.map(plan =>
            <Button
              key={plan.id}
              sx={{
                backgroundColor: 'secondary.main',
                color: 'secondary.contrastText',
                textTransform: 'none'
              }}
              onClick={() => navigate(`/settings/${plan.id}`)}
              variant="outlined"
            >
              {plan.title}
            </Button>
          )}
        </CardContent>
      </Card>
    </>
  )
}
