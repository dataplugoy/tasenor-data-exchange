import React, { } from 'react'
import { Box, Button, Typography } from '@mui/material'
import { Trans } from 'react-i18next'
import { FlowPlanSelector } from '../Components/FlowPlanSelector'
import { useNavigate } from 'react-router-dom'

export const RulesPage = (): React.JSX.Element => {
  const navigate = useNavigate()

  return <Box>
    <Typography variant="h1">
      <Trans>Rules</Trans>
    </Typography>
    <Box sx={{ mt: 2 }}>
      <FlowPlanSelector />
    </Box>
    <Box sx={{ mt: 2 }}>
      <Button variant="outlined" onClick={() => navigate('/rules/questions')} data-cy="RuleQuestions"><Trans>Questions of the Rules</Trans></Button>
    </Box>
  </Box>
}
