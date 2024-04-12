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
import { ResultIndicator } from './ResultIndicator'
import clone from 'clone'
import { RunDetails } from './RunDetails'

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
  const [opened, setOpened] = useState<Set<number>>(new Set())

  useEffect(() => {
    GET(`/batches/${batch.id}`).then(res => {
      setRuns(res?.runs || [])
      setInputs((res?.inputs || []).reduce((prev, cur) => ({...prev, [cur.runId]: (prev[cur.runId] || []).concat([cur])}), {}))
      setUnifieds((res?.unifieds || []).reduce((prev, cur) => ({...prev, [cur.runId]: (prev[cur.runId] || []).concat([cur])}), {}))
      setOutputs((res?.outputs || []).reduce((prev, cur) => ({...prev, [cur.runId]: (prev[cur.runId] || []).concat([cur])}), {}))
    })
  }, [])

  const onToggle = (id: number) => {
    if (opened.has(id)) {
      opened.delete(id)
    } else {
      opened.add(id)
    }
    setOpened(clone(opened))
  }

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
            <TableCell variant="head"><Trans>Result</Trans></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
        {
          sorted.map(result =>
            <React.Fragment key={result.run.id}>
              <TableRow hover onClick={() => onToggle(result.run.id)}>
                <TableCell>{result.run.id}</TableCell>
                <TableCell>{DateTime.fromISO(result.run.updated as string).toLocaleString(DateTime.TIME_WITH_SECONDS)}</TableCell>
                <TableCell><DescribeStateChange result={result}/></TableCell>
                <TableCell><OutputSummary result={result}/></TableCell>
                <TableCell><ResultIndicator result={result}/></TableCell>
              </TableRow>
              { !opened.has(result.run.id) &&
                <TableRow>
                  <TableCell colSpan={5}>
                    <RunDetails batch={batch} result={result}/>
                  </TableCell>
                </TableRow>
              }
            </React.Fragment>
          )
        }
        </TableBody>
      </Table>
    </Box>
  )
}
