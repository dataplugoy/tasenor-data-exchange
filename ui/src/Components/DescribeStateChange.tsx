import React, { } from 'react'
import { Box, Card, CardContent, CardHeader, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { ProjectsResponse } from '../Types/API/projects/ProjectsResponse'
import { Trans, useTranslation } from 'react-i18next'
import { AccountTree, Check } from '@mui/icons-material'
import { useApp } from '../Hooks/useApp'
import { BatchState } from '../Types/BatchState'

interface DescribeStateChangeProps {
  initialState: BatchState
  finalState: BatchState
}

export const DescribeStateChange = (props: DescribeStateChangeProps): React.JSX.Element => {
  const { initialState, finalState } = props
  const { t } = useTranslation()

  return (
    <Box sx={{ display: 'inline', color: initialState === finalState ? 'error.main' : undefined }}>
      {t(`${initialState} - ${finalState}`)}
    </Box>
  )
}
