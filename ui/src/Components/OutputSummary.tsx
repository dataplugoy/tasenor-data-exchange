import React, {  } from 'react'
import { Box } from '@mui/material'
import { Run } from '../Types/API/Run'
import { InputItem } from '../Types/API/InputItem'
import { UnifiedItem } from '../Types/API/UnifiedItem'
import { OutputItem } from '../Types/API/OutputItem'

interface OutputSummaryProps {
  run: Run
  previousRun?: Run
  inputs: Record<number, InputItem[]>
  unifieds: Record<number, UnifiedItem[]>
  outputs: Record<number, OutputItem[]>
}

export const OutputSummary = (props: OutputSummaryProps): React.JSX.Element => {
  const { run, previousRun, inputs, unifieds, outputs } = props

  let total = (inputs[run.id] || []).length + (unifieds[run.id] || []).length + (outputs[run.id] || []).length

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

  // Output total is the same as produced items in previous run.
  if (run.initialState === 'OUTPUT_CREATED' && previousRun) {
    // TODO: Not correct when failing in between. Need more comprehensive structuring.
    total = (outputs[previousRun.id] || []).length
  }

  return (
    <Box sx={{ display: 'inline' }}>
      {['BATCH_CREATED', 'DATA_FETCHED'].includes(run.finalState) ? '—'  : `${done} / ${total}`}
    </Box>
  )
}
