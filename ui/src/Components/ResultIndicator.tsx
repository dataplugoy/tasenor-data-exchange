import React, { } from 'react'
import { Box } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { RunResult } from '../Helpers/sorter'

interface ResultIndicatorProps {
  result: RunResult
}

/**
 * Describe in text what has happened in state change.
 * @param props
 * @returns
 */
export const ResultIndicator = (props: ResultIndicatorProps): React.JSX.Element => {
  const { result } = props
  const { t } = useTranslation()

  let color: undefined | string
  if (result.result === 'All Success') {
    color = 'success.main'
  }
  if (result.result === 'All Failed') {
    color = 'error.main'
  }

  return (
    <Box sx={{ display: 'inline', color }}>
      {t(result.result)}
    </Box>
  )
}
