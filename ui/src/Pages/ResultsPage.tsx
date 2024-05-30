import React, { useEffect, useState } from 'react'
import { useApp } from '../Hooks/useApp'
import { Box, Typography } from '@mui/material'
import { Trans } from 'react-i18next'
import { useGET } from '../Hooks/useNet'
import { ProjectOutputResponse } from '../Types/API/projects/ProjectOutputResponse'
import { TransactionTable } from '../Components/TransactionTable'

export const ResultsPage = (): React.JSX.Element => {
  const app = useApp()
  const [output, setOutpt] = useState<ProjectOutputResponse>([])
  const GET = useGET<ProjectOutputResponse>()

  useEffect(() => {
    GET(`/projects/${app.project.id}/output`).then(res => {
      res && setOutpt(res)
    })
  }, [])

  return <Box>
    <Typography variant="h1">
      <Trans>Project Output</Trans>
    </Typography>

    <Box sx={{ mt: 2 }}>
      <TransactionTable txs={output.map(output => output.data)}/>
    </Box>
  </Box>
}
