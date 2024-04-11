import React, { useEffect, useState } from 'react'
import { Box } from '@mui/material'
import { Batch } from '../Types/API/Batch'
import { useGET } from '../Hooks/useNet'

interface RunListProps {
  batch: Batch
}

export const RunList = (props: RunListProps): React.JSX.Element => {
  const GET = useGET<{}>() // TODO: type
  const { batch } = props
  const [data, setData] = useState({})
  useEffect(() => {
    GET(`/batches/${batch.id}`).then(res => {
      setData(res)
    })
  }, [])

  return (
    <Box>
      <pre>
        {JSON.stringify(data, null, 2)}
      </pre>
    </Box>
  )
}
