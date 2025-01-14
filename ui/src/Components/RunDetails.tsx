import React, { useEffect, useState } from 'react'
import { Box, Button, Typography } from '@mui/material'
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
import { Trans } from 'react-i18next'

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
  const GETOutput = useGET<OutputDestination>()
  const GETRun = useGET<Batch>()
  const [output, setOutput] = useState<OutputDestination|null>(null)

  // Get output settings for the last step.
  useEffect(() => {
    if (result.step === 'SUCCESSFUL_OUTPUT_DELIVERED') {
      GETOutput(`/flow-plans/${batch.flowPlanId}/output`).then(res => {
        res && setOutput(res)
      })
    }
  }, [batch.id, result.step])

  const onDownload = () => {
    const url = window.URL.createObjectURL(new Blob([batch.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute(
      'download',
      `TaDeX-source-data`,
    )
    document.body.appendChild(link)
    link.click()
    link.parentNode && link.parentNode.removeChild(link)
  }

  const inputResults = result.items.filter(item => item.type === 'InputItem') as ResultInputItem[]
  const unifiedResults = result.items.filter(item => item.type === 'UnifiedItem') as ResultUnifiedItem[]
  const outputResults = result.items.filter(item => item.type === 'OutputItem') as ResultOutputItem[]
  const errors = result.items.filter(item => item.error !== null)

  return (
    <Box>

      {
        // Show general error.
        result.run.error && <Box sx={{ mb: 4, p: 2, border: '1px solid rgba(255,255,255,0.2)' }}> <ViewError error={result.run.error}/></Box>
      }

      {
        // Show item errors.
        errors.map((item, idx) => {
          return <Box key={idx}>
            {JSON.stringify(item.data, null, 2)}
            {item.error !== null && <ViewError error={item.error.error}/>}
          </Box>
        })
      }

      <Notes notes={result.run.notes}/>

      {
        // Display input items.
        inputResults.length > 0 && inputResults.map((item, idx) => <ViewInput key={idx} item={item}/>)
      }
      {
        // Display unified items.
        unifiedResults.length > 0 && unifiedResults.map((item, idx) => <ViewUnified key={idx} item={item}/>)
      }
      {
        // Display output items.
        outputResults.length > 0 && <TransactionTable txs={outputResults} output={output}/>
      }

      {
        // Show initial data only for the first step.
        result.step === 'SUCCESSFUL_DATA_FETCHED' &&
          <>
            <DisplayBlock>
              { batch.data.split('\n').map((line, idx) => <Typography key={idx} variant="body2">{line}</Typography>) }
            </DisplayBlock>
            <Button onClick={onDownload}><Trans>Download</Trans></Button>
          </>
      }
    </Box>
  )
}
