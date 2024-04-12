import React, { useEffect, useState } from 'react'
import { Box, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material'
import { Batch } from '../Types/API/Batch'
import { useGET } from '../Hooks/useNet'
import { BatchResponse } from '../Types/API/batches/BatchResponse'
import { Run } from '../Types/API/Run'
import { InputItem } from '../Types/API/InputItem'
import { UnifiedItem } from '../Types/API/UnifiedItem'
import { OutputItem } from '../Types/API/OutputItem'
import { Check } from '@mui/icons-material'
import { Trans } from 'react-i18next'
import { DateTime } from 'luxon'
import { DescribeStateChange } from './DescribeStateChange'

interface RunListProps {
  batch: Batch
}

export const RunList = (props: RunListProps): React.JSX.Element => {
  const { batch } = props

  const GET = useGET<BatchResponse>()

  const [runs, setRuns] = useState<Run[]>([])
  const [inputs, setInputs] = useState<Record<number, InputItem[]>>({})
  const [unifieds, setUnifieds] = useState<Record<number, UnifiedItem[]>>({})
  const [outputs, setOutputs] = useState<Record<number, OutputItem[]>>({})

  useEffect(() => {
    GET(`/batches/${batch.id}`).then(res => {
      setRuns(res?.runs || [])
      setInputs((res?.inputs || []).reduce((prev, cur) => ({...prev, [cur.runId]: cur}), {}))
      setUnifieds((res?.unifieds || []).reduce((prev, cur) => ({...prev, [cur.runId]: cur}), {}))
      setOutputs((res?.outputs || []).reduce((prev, cur) => ({...prev, [cur.runId]: cur}), {}))
    })
  }, [])

  return (
    <Box>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell variant="head"><Trans>Time</Trans></TableCell>
            <TableCell variant="head"><Trans>Progress</Trans></TableCell>
            <TableCell variant="head"><Trans>Output</Trans></TableCell>
            <TableCell variant="head"><Trans>Success</Trans></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
        {
          runs.map(run =>
            <TableRow key={run.id} hover>
              <TableCell>{DateTime.fromISO(run.updated as string).toLocaleString(DateTime.TIME_WITH_SECONDS)}</TableCell>
              <TableCell><DescribeStateChange initialState={run.initialState} finalState={run.finalState}/></TableCell>
              <TableCell>{run.id}</TableCell>
              <TableCell>{run.id}</TableCell>
            </TableRow>
          )
        }
        </TableBody>
      </Table>
    </Box>
  )
}
