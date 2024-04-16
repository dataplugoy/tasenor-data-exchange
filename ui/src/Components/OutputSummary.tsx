import React, { } from 'react'
import { Box } from '@mui/material'
import { RunResult } from '../Helpers/sorter'

interface OutputSummaryProps {
  result: RunResult
}

/**
 * Summarize how many items successfully handled versus total items.
 * @param props
 * @returns
 */
export const OutputSummary = (props: OutputSummaryProps): React.JSX.Element => {
  const { result } = props
  const { done, total } = result.run

  return (
    <Box sx={{ display: 'inline' }}>
      {done === null ? '—' : done} / {total === null ? '—' : total}
    </Box>
  )
}
