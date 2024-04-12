import React, { } from 'react'
import { Box } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { RunResult } from '../Helpers/sorter'

interface ResultIndicatorProps {
  result: RunResult
}

/**
 * Describe in text whhat has happened in state change.
 * @param props
 * @returns
 */
export const ResultIndicator = (props: ResultIndicatorProps): React.JSX.Element => {
  const { result } = props
  const { t } = useTranslation()

  // TODO: Color by result.

  return (
    <Box sx={{ display: 'inline' }}>
      {t(result.result)}
    </Box>
  )
}
