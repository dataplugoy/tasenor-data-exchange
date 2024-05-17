import React, { useEffect } from 'react'
import { Box, IconButton, Typography } from '@mui/material'
import { Trans } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { Clear } from '@mui/icons-material'
import { RulesEditor } from '../Components/RulesEditor'
import { useGET } from '../Hooks/useNet'
import { FlowPlanResponse } from '../Types/API/flow-plans/FlowPlanResponse'

export const EditRulesPage = (): React.JSX.Element => {
  const params = useParams()
  const navigate = useNavigate()
  const GET = useGET<FlowPlanResponse>()

  useEffect(() => {
    GET(`/flow-plans/${params.id}/rules`).then(res => {
      console.log(res);
    })
  }, [])

  return <Box>
    <Typography variant="h1" sx={{ display: 'inline-block' }}>
      <IconButton sx={{ mt: -0.8 }} onClick={() => navigate('/rules')}><Clear/></IconButton> <Trans>Edit Rules</Trans>
    </Typography>

    <Box>
      <RulesEditor/>
    </Box>
  </Box>
}
