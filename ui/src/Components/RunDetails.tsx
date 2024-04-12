import React, { } from 'react'
import { Box } from '@mui/material'
import { ResultItem, RunResult, isResultOutputItem } from '../Helpers/sorter'
import { Batch } from '../Types/API/Batch'
import { Trans } from 'react-i18next'
import { Check, Error, QuestionMark, SkipNext } from '@mui/icons-material'

interface RunDetailsProps {
  batch: Batch
  result: RunResult
}

const RunStateIcon = (props: { item: ResultItem }): React.JSX.Element => {
  const success = isResultOutputItem(props.item) ? props.item.delivered : props.item.processed
  if (success) {
    return <Box sx={{ display: 'inline-block', ml: 1 }}><Check sx={{ color: 'success.main', mb: '-0.4rem' }}/></Box>
  }
  if (props.item.skipped) {
    return <Box sx={{ display: 'inline-block', ml: 1 }}><SkipNext sx={{ color: 'primary.main', mb: '-0.4rem' }}/></Box>
  }
  if (props.item.error !== null) {
    return <Box sx={{ display: 'inline-block', ml: 1 }}><Error sx={{ color: 'error.dark', mb: '-0.4rem' }}/></Box>
  }
  return <Box sx={{ display: 'inline-block', ml: 1 }}><QuestionMark sx={{ color: 'secondary.main', mb: '-0.4rem' }}/></Box>
}

const SuccessfulDataFetched = (props: RunDetailsProps): React.JSX.Element => {
  const { batch } = props
  return (
    <Box>
      <pre>
        {batch.data}
      </pre>
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
            <RunStateIcon item={item}/>
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
  }

  return (
    <Box sx={{ color: 'error.light' }}>
      TODO: Details of {result.step}
    </Box>
  )
}
