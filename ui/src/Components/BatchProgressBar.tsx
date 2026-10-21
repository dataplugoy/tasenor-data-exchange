import React, { } from 'react'
import { Box, Tooltip } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { BatchState } from '../Types/BatchState'
import { ledger } from '../theme'

interface BatchBrogressBarProps {
  state: BatchState
}

/**
 * The processing steps of a batch: done steps in soft navy, the step the batch waits for in yellow.
 */
export const BatchBrogressBar = (props: BatchBrogressBarProps): React.JSX.Element => {
  const { state } = props
  const { t } = useTranslation()
  const states = ['BATCH_CREATED', 'DATA_FETCHED', 'DATA_PARSED', 'ITEMS_UNIFIED', 'OUTPUT_CREATED', 'OUTPUT_DELIVERED']
  const done = states.indexOf(state)
  const steps = [t('Data fetched'), t('Data parsed'), t('Items unified'), t('Output created'), t('Output delivered')]

  return (
    <Box role="list" aria-label={t('Processing steps')} sx={{ display: 'flex', gap: '3px', alignItems: 'center', height: '100%' }}>
      {steps.map((step, idx) => {
        const status = idx < done ? 'done' : (idx === done ? 'waiting' : 'todo')
        return (
          <Tooltip key={step} title={step}>
            <Box
              role="listitem"
              aria-label={`${step}: ${status === 'done' ? t('done') : status === 'waiting' ? t('next') : t('not yet')}`}
              sx={{
                flex: 1,
                height: '0.5rem',
                borderRadius: '2px',
                backgroundColor: status === 'done' ? ledger.navySoft : status === 'waiting' ? ledger.coin : ledger.rule,
              }}
            />
          </Tooltip>
        )
      })}
    </Box>
  )
}
