import React, { useEffect, useState } from 'react'
import { Box, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material'
import { Batch } from '../Types/API/Batch'
import { useGET } from '../Hooks/useNet'
import { BatchResponse } from '../Types/API/batches/BatchResponse'
import { Run } from '../Types/API/Run'
import { InputItem } from '../Types/API/InputItem'
import { UnifiedItem } from '../Types/API/UnifiedItem'
import { OutputItem } from '../Types/API/OutputItem'
import { Trans } from 'react-i18next'
import { DateTime } from 'luxon'
import { DescribeStateChange } from './DescribeStateChange'
import { OutputSummary } from './OutputSummary'
import { sortRuns } from '../Helpers/sorter'

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
      setInputs((res?.inputs || []).reduce((prev, cur) => ({...prev, [cur.runId]: (prev[cur.runId] || []).concat([cur])}), {}))
      setUnifieds((res?.unifieds || []).reduce((prev, cur) => ({...prev, [cur.runId]: (prev[cur.runId] || []).concat([cur])}), {}))
      setOutputs((res?.outputs || []).reduce((prev, cur) => ({...prev, [cur.runId]: (prev[cur.runId] || []).concat([cur])}), {}))
    })
  }, [])

  const sorted = sortRuns(runs, inputs, unifieds, outputs)

  return (
    <Box>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell variant="head">#</TableCell>
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
              <TableCell>{run.id}</TableCell>
              <TableCell>{DateTime.fromISO(run.updated as string).toLocaleString(DateTime.TIME_WITH_SECONDS)}</TableCell>
              <TableCell><DescribeStateChange initialState={run.initialState} finalState={run.finalState}/></TableCell>
              <TableCell><OutputSummary run={run} inputs={inputs} unifieds={unifieds} outputs={outputs}/></TableCell>
              <TableCell>{run.id}</TableCell>
            </TableRow>
          )
        }
        </TableBody>
      </Table>
    </Box>
  )
}
