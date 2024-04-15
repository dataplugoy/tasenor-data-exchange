import React, { } from 'react'
import { Box } from '@mui/material'
import { ResultItem, RunResult, isResultOutputItem } from '../Helpers/sorter'
import { Batch } from '../Types/API/Batch'
import { Trans } from 'react-i18next'
import { Check, Error, HourglassEmpty, SkipNext } from '@mui/icons-material'
import { ViewError } from './ViewError'

// TODO: All JSON-presentations should be converted to nice item specific viewers.

interface RunDetailsProps {
  batch: Batch
  result: RunResult
}

const RunStateSuccessIcon = (): React.JSX.Element => {
  return <Box sx={{ display: 'inline-block', ml: 1 }}><Check sx={{ color: 'success.main', mb: '-0.4rem' }}/></Box>
}

const RunStateIcon = (props: { item: ResultItem }): React.JSX.Element => {
  const success = isResultOutputItem(props.item) ? props.item.delivered : props.item.processed
  if (success) {
    <RunStateSuccessIcon/>
  }
  if (props.item.skipped) {
    return <Box sx={{ display: 'inline-block', ml: 1 }}><SkipNext sx={{ color: 'primary.main', mb: '-0.4rem' }}/></Box>
  }
  if (props.item.error !== null) {
    return <Box sx={{ display: 'inline-block', ml: 1 }}><Error sx={{ color: 'error.dark', mb: '-0.4rem' }}/></Box>
  }
  return <Box sx={{ display: 'inline-block', ml: 1 }}><HourglassEmpty sx={{ color: 'secondary.light', mb: '-0.4rem' }}/></Box>
}

const SuccessfulDataFetched = (props: RunDetailsProps): React.JSX.Element => {
  const { batch } = props
  return (
    <Box>
      <Trans>Data received:</Trans>
      <Box sx={{ border: '1px solid rgba(0,0,0,0.5)', backgroundColor: 'rgb(255,255,255,0.05)', px: 2 }}>
        <pre>{batch.data}</pre>
      </Box>
    </Box>
  )
}

const SuccessfulDataParsed = (props: RunDetailsProps): React.JSX.Element => {
  const { result } = props

  return (
    <Box>
      {
        result.items.map((item, idx) => <Box key={idx}>
          <Box>
            <><Trans>Line #</Trans>{item.data.line}: {item.data.time} {item.data.text}  {item.data.total}</>
            <RunStateSuccessIcon/>
          </Box>
          <Box>
            {JSON.stringify(item.data.fields)}
          </Box>
        </Box>)
      }
    </Box>
  )
}

const SuccessfulItemsUnified = (props: RunDetailsProps): React.JSX.Element => {
  const { result } = props

  return (
    <Box>
      {
        result.items.map((item, idx) => <Box key={idx}>
          <Box>{JSON.stringify(item.data)}<RunStateIcon item={item}/></Box>
          {item.stockChange && JSON.stringify(item.stockChange)}
        </Box>)
      }
    </Box>
  )
}

const SuccessOutputCreated = (props: RunDetailsProps): React.JSX.Element => {
  const { result } = props

  return (
    <Box>
      {
        result.items.map((item, idx) => <Box key={idx}>
          <Box>{item.data.time}<RunStateIcon item={item}/></Box>
          {item.data.lines.map((line, idx) => <Box key={idx}>{JSON.stringify(line)}</Box>)}
        </Box>)
      }
    </Box>
  )
}

const FailedWithErrors = (props: RunDetailsProps): React.JSX.Element => {
  const { result } = props
  // TODO: Supports input items only.
  return (
    <Box>
      {
        result.items.map((item, idx) => {
          return item.error !== null && <Box key={idx}>
            {JSON.stringify(item.data.original, null, 2)}
            <ViewError error={item.error}/>
          </Box>
        })
      }
    </Box>
  )

}

const Dump = (props: RunDetailsProps): React.JSX.Element => {
  const { result } = props
  return (
    <Box>
      <pre>
        {JSON.stringify(result, null, 2)}
      </pre>
    </Box>
  )
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
    case 'FAILED_AFTER_DATA_PARSED':
      return <FailedWithErrors batch={batch} result={result}/>
  }

  return (
    <Box sx={{ color: 'error.light' }}>
      TODO: Details of {result.step}
    </Box>
  )
}
