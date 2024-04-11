import React, { } from 'react'
import { Box, Card, CardContent, CardHeader, Slider, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { Trans } from 'react-i18next'
import { Air } from '@mui/icons-material'
import { FlowPlan } from '../Types/API/FlowPlan'
import { useNavigate } from 'react-router-dom'

interface BatchBrogressBarProps {
  state: "BATCH_CREATED" | "DATA_FETCHED" | "DATA_PARSED" | "ITEMS_UNIFIED" | "OUTPUT_CREATED" | "OUTPUT_DELIVERED"
}

export const BatchBrogressBar = (props: BatchBrogressBarProps): React.JSX.Element => {
  const { state } = props
  const states = ["BATCH_CREATED", "DATA_FETCHED", "DATA_PARSED", "ITEMS_UNIFIED", "OUTPUT_CREATED", "OUTPUT_DELIVERED"]
  const pos = states.indexOf(state) / (states.length - 1)

  return (
    <Box sx={{
        position: 'relative',
        height: '1rem',
        backgroundColor: 'secondary.main',
        borderBottom: '3px solid',
        borderBottomColor: 'secondary.dark',
        borderTop: '3px solid',
        borderTopColor: 'secondary.light',
      }}
    >
      <Box sx={{
        position: 'absolute',
        top: '-3px',
        left: 0,
        right: `${(1 - pos) * 100}%`,
        height: '1rem',
        backgroundColor: 'primary.main',
        borderBottom: '3px solid',
        borderBottomColor: 'primary.dark',
        borderTop: '3px solid',
        borderTopColor: 'primary.light',

      }}/>
    </Box>
  )
}
