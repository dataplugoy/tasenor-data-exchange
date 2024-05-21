import React, { } from 'react'
import { Box, Typography } from '@mui/material'
import { ResultItem, RunStepResult, isResultOutputItem, ResultInputItem, ResultUnifiedItem, ResultOutputItem } from '../Helpers/sorter'
import { Batch } from '../Types/API/Batch'
import { Trans } from 'react-i18next'
import { Check, Error, HourglassEmpty, SkipNext } from '@mui/icons-material'
import { ViewError } from './ViewError'
import { DisplayBlock } from './DisplayBlock'

// TODO: All JSON-presentations should be converted to nice item specific viewers.

interface RunDetailsProps {
  batch: Batch
  result: RunStepResult
}

const RunStateSuccessIcon = (): React.JSX.Element => {
  return <Box sx={{ display: 'inline-block', ml: 1 }}><Check sx={{ color: 'success.main', mb: '-0.4rem' }}/></Box>
}

interface RunStateIconProps {
  result: RunStepResult
  item: ResultItem
}

const RunStateIcon = (props: RunStateIconProps): React.JSX.Element => {
  const { item, result } = props
  let success = isResultOutputItem(item) ? item.delivered : item.processed
  const progress = result.run.initialState !== result.run.finalState
  const step = result.step

  if (!success && progress && ['SUCCESSFUL_DATA_PARSED', 'SUCCESSFUL_ITEMS_UNIFIED', 'SUCCESSFUL_OUTPUT_CREATED'].includes(step)) {
    success = true
  }

  if (success) {
    return <RunStateSuccessIcon/>
  }
  if (item.skipped) {
    return <Box sx={{ display: 'inline-block', ml: 1 }}><SkipNext sx={{ color: 'primary.main', mb: '-0.4rem' }}/></Box>
  }
  if (item.error !== null) {
    return <Box sx={{ display: 'inline-block', ml: 1 }}><Error sx={{ color: 'error.dark', mb: '-0.4rem' }}/></Box>
  }

  return <Box sx={{ display: 'inline-block', ml: 1 }}><HourglassEmpty sx={{ color: 'secondary.light', mb: '-0.4rem' }}/></Box>
}

const SuccessfulDataFetched = (props: RunDetailsProps): React.JSX.Element => {
  const { batch } = props

  return (
    <DisplayBlock>
        {batch.data.split('\n').map((line, idx) => <Typography key={idx} variant="body2">{line}</Typography>)}
    </DisplayBlock>
  )
}

const SuccessfulDataParsed = (props: RunDetailsProps): React.JSX.Element => {
  const { result } = props
  const items: ResultInputItem[] = result.items as ResultInputItem[]
  return (
    <DisplayBlock>
      {
        items.map((item, idx) => <Box key={idx}>
          <Box>
            <><Trans>Line #</Trans>{item.data.line}: {item.data.time} {item.data.text}  {item.data.total}</>
            <RunStateSuccessIcon/>
          </Box>
          <Box>
            {JSON.stringify(item.data.fields)}
          </Box>
        </Box>)
      }
    </DisplayBlock>
  )
}

const SuccessfulItemsUnified = (props: RunDetailsProps): React.JSX.Element => {
  const { result } = props
  const items: ResultUnifiedItem[] = result.items as ResultUnifiedItem[]

  return (
    <DisplayBlock>
      {
        items.map((item, idx) => <Box key={idx}>
          <Box>{JSON.stringify(item.data)}<RunStateIcon result={result} item={item}/></Box>
          {item.stockChange && JSON.stringify(item.stockChange)}
        </Box>)
      }
    </DisplayBlock>
  )
}

const SuccessOutputCreated = (props: RunDetailsProps): React.JSX.Element => {
  const { result } = props
  const items: ResultOutputItem[] = result.items as ResultOutputItem[]

  return (
    <Box>
      {
        items.map((item, idx) => <Box key={idx}>
          <Box>{item.data.time}<RunStateIcon result={result} item={item}/></Box>
          {item.data.lines.map((line, idx) => <Box key={idx}>{JSON.stringify(line)}</Box>)}
        </Box>)
      }
    </Box>
  )
}

const FailedAfterBatchCreated = (props: RunDetailsProps): React.JSX.Element => {
  const { result } = props
  const runResult = result.run.result as string
  return (
    <DisplayBlock>
        {result.run.error && <ViewError error={result.run.error}/>}
        {runResult === 'WAITING' && <Trans>Waiting for file upload.</Trans>}
    </DisplayBlock>
  )

}

const FailedAfterDataFetched = (props: RunDetailsProps): React.JSX.Element => {
  return FailedAfterBatchCreated(props)
}

function RenderErrorOrItemErrors<T extends ResultItem>(props: RunDetailsProps): React.JSX.Element {
  const { result } = props
  const items: T[] = result.items as T[]
  const noItemErrors = items.filter(i => !!i.error).length === 0

  return (
    <DisplayBlock>
      {
        noItemErrors && result.run.error && <ViewError error={result.run.error}/>
      }
      {
        items.map((item, idx) => {
          return item.error !== null && <Box key={idx}>
            {JSON.stringify(item.data, null, 2)}
            <ViewError error={item.error.error}/>
          </Box>
        })
      }
    </DisplayBlock>
  )
}

const FailedAfterDataParsed = (props: RunDetailsProps): React.JSX.Element => {
  return RenderErrorOrItemErrors<ResultInputItem>(props)
}

const FailedAfterItemsUnified = (props: RunDetailsProps): React.JSX.Element => {
  return RenderErrorOrItemErrors<ResultUnifiedItem>(props)
}

const FailedAfterOutputCreated = (props: RunDetailsProps): React.JSX.Element => {
  return RenderErrorOrItemErrors<ResultUnifiedItem>(props)
}

/**
 * Describe in text whhat has happened in state change.
 * @param props
 * @returns
 */
export const RunDetails = (props: RunDetailsProps): React.JSX.Element => {
  const { batch, result } = props

  switch (result.step) {
    case 'SUCCESSFUL_DATA_FETCHED':
      return <SuccessfulDataFetched batch={batch} result={result}/>
    case 'SUCCESSFUL_DATA_PARSED':
      return <SuccessfulDataParsed batch={batch} result={result}/>
    case 'SUCCESSFUL_ITEMS_UNIFIED':
      return <SuccessfulItemsUnified batch={batch} result={result}/>
    case 'SUCCESSFUL_OUTPUT_CREATED':
      return <SuccessOutputCreated batch={batch} result={result}/>
    case 'SUCCESSFUL_OUTPUT_DELIVERED':
      return <SuccessOutputCreated batch={batch} result={result}/>
    case 'FAILED_AFTER_BATCH_CREATED':
      return <FailedAfterBatchCreated batch={batch} result={result}/>
    case 'FAILED_AFTER_DATA_FETCHED':
      return <FailedAfterDataFetched batch={batch} result={result}/>
    case 'FAILED_AFTER_DATA_PARSED':
      return <FailedAfterDataParsed batch={batch} result={result}/>
    case 'FAILED_AFTER_ITEMS_UNIFIED':
      return <FailedAfterItemsUnified batch={batch} result={result}/>
    case 'FAILED_AFTER_OUTPUT_CREATED':
      return <FailedAfterOutputCreated batch={batch} result={result}/>
  }

  return (
    <Box sx={{ color: 'error.light' }}>
      <Trans>Not implemented.</Trans>
    </Box>
  )
}
