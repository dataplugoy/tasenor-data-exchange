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
  const result = props.result.run.result
  const { t } = useTranslation()

  let color: undefined | string
  if (result === 'ALL_SUCCESS') {
    color = 'success.main'
  }
  if (result === 'ALL_FAILED') {
    color = 'error.main'
  }

  return (
    <Box sx={{ display: 'inline', color }}>
      {t(`RESULT_${result}`)}
    </Box>
  )
}
