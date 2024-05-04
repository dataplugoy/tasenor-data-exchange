import React, { } from 'react'
import { Box, useTheme } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { RunStepResult } from '../Helpers/sorter'

interface DescribeStateChangeProps {
  result: RunStepResult
}

/**
 * Describe in text whhat has happened in state change.
 * @param props
 * @returns
 */
export const DescribeStateChange = (props: DescribeStateChangeProps): React.JSX.Element => {
  const { result } = props
  const { initialState, finalState } = result.run
  const theme = useTheme()

  const { t } = useTranslation()
  const state = result.run.result

  return (
    <Box sx={{ display: 'inline', color: state === 'WAITING' ? theme.palette.grey[600] : (initialState === finalState ? 'error.main' : undefined) }}>
      {t(`${initialState} - ${finalState}`)}
    </Box>
  )
}
