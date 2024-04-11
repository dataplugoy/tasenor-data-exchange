import React, { useEffect } from 'react'
import { Box } from '@mui/material'
import { Batch } from '../Types/API/Batch'
import { useGET } from '../Hooks/useNet'

interface RunListProps {
  batch: Batch
}

export const RunList = (props: RunListProps): React.JSX.Element => {
  const GET = useGET<{}>() // TODO: type
  const { batch } = props

  useEffect(() => {
    GET(`/batches/${batch.id}`).then(res => {
      console.log(res);
    })
  }, [])

  return (
    <Box>
      RUN LIST
    </Box>
  )
}
