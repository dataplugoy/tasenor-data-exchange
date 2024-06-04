import React, { useEffect, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { RunStepResult, ResultInputItem, ResultUnifiedItem, ResultOutputItem } from '../Helpers/sorter'
import { Batch } from '../Types/API/Batch'
import { ViewError } from './ViewError'
import { DisplayBlock } from './DisplayBlock'
import { Notes } from './Notes'
import { TransactionTable } from './TransactionTable'
import { useGET } from '../Hooks/useNet'
import { OutputDestination } from '../Types/API/OutputDestination'
import { ViewUnified } from './ViewUnified'
import { ViewInput } from './ViewInput'

interface RunDetailsProps {
  batch: Batch
  result: RunStepResult
}

/**
 * Describe in text whhat has happened in state change.
 * @param props
 * @returns
 */
export const RunDetails = (props: RunDetailsProps): React.JSX.Element => {
  const { batch, result } = props
  const GET = useGET<OutputDestination>()
  const [output, setOutput] = useState<OutputDestination|null>(null)

  // Get output settings for the last step.
  useEffect(() => {
    if (result.step === 'SUCCESSFUL_OUTPUT_DELIVERED') {
      GET(`/flow-plans/${batch.flowPlanId}/output`).then(res => {
        res && setOutput(res)
      })
    }
  }, [batch.id, result.step])

  return (
    <Box>

      {
        // Show general error.
        result.run.error && <ViewError error={result.run.error}/>
      }

      {
        // Show item errors.
        result.items.filter(item => item.error !== null).map((item, idx) => {
          return <Box key={idx}>
            {JSON.stringify(item.data, null, 2)}
            {item.error !== null && <ViewError error={item.error.error}/>}
          </Box>
        })
      }

      <Notes notes={result.run.notes}/>

      {
        // TODO: Just filter per type?
        // Display input items.
        result.items.length > 0 && result.items[0].type === 'InputItem' &&
          result.items.map((item, idx) => <ViewInput key={idx} item={item as ResultInputItem}/>)
      }
      {
        // Display unified items.
        result.items.length > 0 && result.items[0].type === 'UnifiedItem' &&
          result.items.map((item, idx) => <ViewUnified key={idx} item={item as ResultUnifiedItem}/>)
      }
      {
        // Display output items.
        result.items.length > 0 && result.items[0].type === 'OutputItem' &&
          <TransactionTable txs={result.items as ResultOutputItem[]} output={output}/>
      }

      {
        // Show initial data only for the first step.
        result.step === 'SUCCESSFUL_DATA_FETCHED' &&
          <DisplayBlock>
          { batch.data.split('\n').map((line, idx) => <Typography key={idx} variant="body2">{line}</Typography>) }
          </DisplayBlock>
      }
    </Box>
  )
}
