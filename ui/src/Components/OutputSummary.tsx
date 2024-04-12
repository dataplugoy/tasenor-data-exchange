import React, { useEffect, useState } from 'react'
import { Box, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material'
import { Batch } from '../Types/API/Batch'
import { useGET } from '../Hooks/useNet'
import { BatchResponse } from '../Types/API/batches/BatchResponse'
import { Run } from '../Types/API/Run'
import { InputItem } from '../Types/API/InputItem'
import { UnifiedItem } from '../Types/API/UnifiedItem'
import { OutputItem } from '../Types/API/OutputItem'
import { Trans } from 'react-i18next'
import { DateTime } from 'luxon'
import { DescribeStateChange } from './DescribeStateChange'

interface OutputSummaryProps {
  run: Run
  inputs: Record<number, InputItem[]>
  unifieds: Record<number, UnifiedItem[]>
  outputs: Record<number, OutputItem[]>
}

export const OutputSummary = (props: OutputSummaryProps): React.JSX.Element => {
  const { run, inputs, unifieds, outputs } = props

  const total = (inputs[run.id] || []).length + (unifieds[run.id] || []).length + (outputs[run.id] || []).length

  let done = 0
  let skips = false;

  (inputs[run.id] || []).forEach(item => {
    skips ||= item.skipped
    done += (item.skipped || item.processed) ? 1 : 0
  });
  (unifieds[run.id] || []).forEach(item => {
    skips ||= item.skipped
    done += (item.skipped || item.processed) ? 1 : 0
  });
  (outputs[run.id] || []).forEach(item => {
    skips ||= item.skipped
    done += (item.skipped || item.delivered) ? 1 : 0
  })

  // TODO: Total for delivery attempt.

  // Analysis counts successful conversions.
  if (run.initialState === 'ITEMS_UNIFIED' && run.finalState === 'OUTPUT_CREATED') {
    done = (outputs[run.id] || []).length
  }

  return (
    <Box sx={{ display: 'inline' }}>
      {['BATCH_CREATED', 'DATA_FETCHED'].includes(run.finalState) ? '—'  : `${done} / ${total}`}
    </Box>
  )
}
