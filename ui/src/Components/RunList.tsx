import React, { useEffect } from 'react'
import { Box } from '@mui/material'
import { Batch } from '../Types/API/Batch'

interface RunListProps {
  batch: Batch
}

export const RunList = (props: RunListProps): React.JSX.Element => {

  useEffect(() => {
    console.log('TODO: Fetch run list')
  }, [])

  return (
    <Box>
      RUN LIST
    </Box>
  )
}
