import React, { } from 'react'
import { Box } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { RunResult } from '../Helpers/sorter'

interface DescribeStateChangeProps {
  result: RunResult
}

/**
 * Describe in text whhat has happened in state change.
 * @param props
 * @returns
 */
export const DescribeStateChange = (props: DescribeStateChangeProps): React.JSX.Element => {
  const { result } = props
  const { initialState, finalState } = result.run

  const { t } = useTranslation()
  // TODO: Color by result.

  return (
    <Box sx={{ display: 'inline', color: initialState === finalState ? 'error.main' : undefined }}>
      {t(`${initialState} - ${finalState}`)}
    </Box>
  )
}
