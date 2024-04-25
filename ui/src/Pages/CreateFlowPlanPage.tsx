import React, { useState } from 'react'
import { Box, Button, MenuItem, TextField, Typography } from '@mui/material'
import { Trans, useTranslation } from 'react-i18next'
import { useApp } from '../Hooks/useApp'

declare const NODE_ENV: string

export const CreateFlowPlanPage = (): React.JSX.Element => {

  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('NO_ACTION')
  const [fileUrl, setFileUrl] = useState('file:///')
  const app = useApp()

  const onCreate = () => {
    if (!name) return app.addError(t('Name is required.'))
    if (!input) return app.addError(t('Data source must be selected.'))

    const sourceSettings = input === 'TEST_MOCK' ? { url: fileUrl } : {}
    const destinationSettings = {}
    const data = {
      name,
      source: {
        type: input,
        settings: sourceSettings,
      },
      destination: {
        type: output,
        settings: destinationSettings,
      },
    }
    console.log(data)
  }

  return (
    <Box>
      <Typography variant="h1" textAlign="center">
        <Trans>Create Flow Plan</Trans>
      </Typography>

      <Box sx={{ mt: 5, textAlign: 'center', ml: '35%' }}>
        <Box sx={{ display: 'grid', textAlign: 'left', gridTemplateColumns: '50%', rowGap: '1rem' }}>
          <TextField autoComplete="off" required fullWidth onChange={e => setName(e.target.value)} value={name} name="name" label={t('Name')}/>

          <TextField select label={t('Data Source')} value={input} onChange={e => setInput(e.target.value)}>
            {NODE_ENV !== 'prod' && <MenuItem value="TEST_MOCK"><Trans>Fixed Test File</Trans></MenuItem>}
            <MenuItem value="ENABLE_BANKING"><Trans>Enable Banking Service</Trans></MenuItem>
          </TextField>

          {
            input === 'TEST_MOCK' && <TextField autoComplete="off" required fullWidth onChange={e => setFileUrl(e.target.value)} value={fileUrl} name="fileUrl" label={t('File URL')}/>
          }

          <TextField select label={t('Bookkeeping Destination')} value={output} onChange={e => setOutput(e.target.value)}>
            {NODE_ENV !== 'prod' && <MenuItem value="TEST_MOCK">Fixed Test Files</MenuItem>}
            <MenuItem value="NO_ACTION"><Trans>Keep results in TaDeX</Trans></MenuItem>
          </TextField>

          <Button sx={{ mt: 2 }}onClick={onCreate} variant="outlined"><Trans>Create</Trans></Button>

        </Box>

      </Box>
    </Box>
  )
}
