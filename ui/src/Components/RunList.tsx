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
import { DescribeStateChange } from './DescribeStateChange'
import { OutputSummary } from './OutputSummary'
import { sortRuns } from '../Helpers/sorter'
import { ResultIndicator } from './ResultIndicator'
import clone from 'clone'
import { RunDetails } from './RunDetails'
import { whenBatchUpdates, whenRunUpdates, whenUploadUpdates } from '../Signals/updates'
import { ItemError } from '../Types/API/ItemError'
import { useApp } from '../Hooks/useApp'
import { time2str } from '../Helpers/stringify'
import { Language, Timestring } from '@tasenor/common'

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
  const [errors, setErrors] = useState<ItemError[]>([])
  const [opened, setOpened] = useState<Set<number>>(new Set())
  const app = useApp()
  const { language } = app.project.settings

  let deleted = false

  const updateRunList = async () => {

    if (deleted) return

    GET(`/batches/${batch.id}`).then(res => {
      setRuns(res?.runs || [])
      setInputs((res?.inputs || []).reduce((prev, cur) => ({ ...prev, [cur.runId]: (prev[cur.runId] || []).concat([cur]) }), {}))
      setUnifieds((res?.unifieds || []).reduce((prev, cur) => ({ ...prev, [cur.runId]: (prev[cur.runId] || []).concat([cur]) }), {}))
      setOutputs((res?.outputs || []).reduce((prev, cur) => ({ ...prev, [cur.runId]: (prev[cur.runId] || []).concat([cur]) }), {}))
      setErrors(res?.errors || [])
    })
  }

  useEffect(() => {
    updateRunList()
    whenBatchUpdates(() => updateRunList())
    whenUploadUpdates(() => updateRunList())
    whenRunUpdates(() => updateRunList())
    return () => {
      // This is little bit nasty hack since signal watcher function stays active.
      deleted = true
    }
  }, [])

  const onToggle = (id: number) => {
    if (opened.has(id)) {
      opened.delete(id)
    } else {
      opened.add(id)
    }
    setOpened(clone(opened))
  }

  const sorted = sortRuns(runs, inputs, unifieds, outputs, errors)

  return (
    <Box>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell variant="head">#</TableCell>
            <TableCell variant="head"><Trans>Time</Trans></TableCell>
            <TableCell variant="head"><Trans>Description</Trans></TableCell>
            <TableCell variant="head"><Trans>Progress</Trans></TableCell>
            <TableCell variant="head"><Trans>Result</Trans></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
        {
          sorted.map(result =>
            <React.Fragment key={result.run.id}>
              <TableRow hover onClick={() => onToggle(result.run.id)}>
                <TableCell>{result.run.id}</TableCell>
                <TableCell>{time2str(result.run.updated as Timestring, language as Language)}</TableCell>
                <TableCell><DescribeStateChange result={result}/></TableCell>
                <TableCell><OutputSummary result={result}/></TableCell>
                <TableCell><ResultIndicator result={result}/></TableCell>
              </TableRow>
              { opened.has(result.run.id) &&
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
