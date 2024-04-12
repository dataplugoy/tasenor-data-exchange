import React, { useEffect, useState } from 'react'
import { Box } from '@mui/material'
import { Batch } from '../Types/API/Batch'
import { useGET } from '../Hooks/useNet'
import { BatchResponse } from '../Types/API/batches/BatchResponse'
import { Run } from '../Types/API/Run'
import { InputItem } from '../Types/API/InputItem'
import { UnifiedItem } from '../Types/API/UnifiedItem'
import { OutputItem } from '../Types/API/OutputItem'

interface RunListProps {
  batch: Batch
}

export const RunList = (props: RunListProps): React.JSX.Element => {
  const { batch } = props

  const GET = useGET<BatchResponse>()

  const [runs, setRuns] = useState<Run[]>([])
  const [inputs, setInputs] = useState<InputItem[]>([])
  const [unifieds, setUnifieds] = useState<UnifiedItem[]>([])
  const [outputs, setOutputs] = useState<OutputItem[]>([])

  useEffect(() => {
    GET(`/batches/${batch.id}`).then(res => {
      setRuns(res?.runs || [])
    })
  }, [])

  return (
    <Box>
      <pre>
        {JSON.stringify(runs, null, 2)}
      </pre>
    </Box>
  )
}
