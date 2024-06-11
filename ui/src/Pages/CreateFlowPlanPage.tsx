import React, { useState } from 'react'
import { Box, Button, MenuItem, TextField, Typography } from '@mui/material'
import { Trans, useTranslation } from 'react-i18next'
import { useApp } from '../Hooks/useApp'
import { usePOST } from '../Hooks/useNet'
import { CreateFlowPlanResponse } from '../Types/API/flow-plans/CreateFlowPlanResponse'
import { useNavigate } from 'react-router-dom'

declare const NODE_ENV: string

const DEFAULTS: Record<string, Record<string, unknown>> = {
  TASENOR: {
    accountGrouping: {
      singleFeeAccount: false,
      singleTaxAccount: true,
      singleLossAccount: true,
      singleStockAccount: true,
      singleCryptoAccount: true,
      singleIncomeAccount: false,
      singleProfitAccount: true,
      singleExpenseAccount: false,
      singleDividendAccount: true,
    }
  }
}

export const CreateFlowPlanPage = (): React.JSX.Element => {

  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('NO_ACTION')
  const [fileUrl, setFileUrl] = useState('file:///')
  const [hostUrl, setHostUrl] = useState('https://')
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  const [database, setDatabase] = useState('')

  const app = useApp()
  const POST = usePOST<CreateFlowPlanResponse>()
  const navigate = useNavigate()

  const validateSourceSettings = () => {
    if (input === 'TEST_MOCK') {
      if (!fileUrl || fileUrl === 'file:///') return app.addError('File URL is required.')
      return { url: fileUrl }
    }

    return {}
  }

  const validateDestinationSettings = () => {
    if (output === 'TASENOR') {
      if (!hostUrl || hostUrl === 'https://') return app.addError('Tasenor server API URL is required.')
      if (!user) return app.addError('Login email is required.')
      if (!password) return app.addError('Password is required.')
      if (!database) return app.addError('Name of the database is required.')
      return {
        host: hostUrl,
        user,
        password,
        database
      }
    }

    return {}
  }

  const onCreate = async () => {
    if (!title) return app.addError(t('Name is required.'))
    if (!input) return app.addError(t('Data source must be selected.'))

    const sourceSettings = validateSourceSettings()
    const destinationSettings = validateDestinationSettings()

    if (!sourceSettings || !destinationSettings) {
      return
    }

    const data = {
      title,
      projectId: app.project.id,
      source: {
        type: input,
        settings: sourceSettings,
      },
      destination: {
        type: output,
        settings: destinationSettings,
      },
      setup: {
      }
    }

    if (DEFAULTS[input]) {
      Object.assign(data.setup, DEFAULTS[input])
    }
    if (DEFAULTS[output]) {
      Object.assign(data.setup, DEFAULTS[output])
    }

    const res = await POST('/flow-plans', data)
    res && navigate(`/flow-plans/${res.id}`)
  }

  return (
    <Box>
      <Typography variant="h1" textAlign="center">
        <Trans>Create Flow Plan</Trans>
      </Typography>

      <Box sx={{ mt: 5, textAlign: 'center', ml: '35%' }}>
        <Box sx={{ display: 'grid', textAlign: 'left', gridTemplateColumns: '50%', rowGap: '1rem' }}>
          <TextField autoComplete="off" required fullWidth onChange={e => setTitle(e.target.value)} value={title} name="name" label={t('Name')}/>

          <TextField data-cy="Data Source" select label={t('Data Source')} value={input} onChange={e => setInput(e.target.value)}>
            {NODE_ENV !== 'prod' && <MenuItem value="TEST_MOCK"><Trans>Fixed Test File</Trans></MenuItem>}
            <MenuItem value="ENABLE_BANKING"><Trans>Enable Banking Service</Trans></MenuItem>
            <MenuItem value="NORDNET"><Trans>Upload Nordnet Statement</Trans></MenuItem>
            <MenuItem value="S_PANKKI"><Trans>Upload S-Pankki Statement</Trans></MenuItem>
          </TextField>

          {
            input === 'TEST_MOCK' && <>
              <TextField autoComplete="off" required fullWidth onChange={e => setFileUrl(e.target.value)} value={fileUrl} name="fileUrl" label={t('File URL')}/>
            </>
          }

          <TextField select label={t('Bookkeeping Destination')} value={output} onChange={e => setOutput(e.target.value)}>
            {NODE_ENV !== 'prod' && <MenuItem value="TEST_MOCK">Fixed Test Files</MenuItem>}
            <MenuItem value="NO_ACTION"><Trans>Keep results in TaDeX</Trans></MenuItem>
            <MenuItem value="TASENOR"><Trans>Upload results to Tasenor</Trans></MenuItem>
          </TextField>

          {
            output === 'TASENOR' && <>
              <TextField autoComplete="off" required fullWidth onChange={e => setHostUrl(e.target.value)} value={hostUrl} name="url" label={t('Tasenor Server API URL')}/>
              <TextField autoComplete="off" required fullWidth onChange={e => setUser(e.target.value)} value={user} name="user" label={t('Login Email')}/>
              <TextField autoComplete="off" required fullWidth onChange={e => setPassword(e.target.value)} value={password} name="password" label={t('Password')} type="password"/>
              <TextField autoComplete="off" required fullWidth onChange={e => setDatabase(e.target.value)} value={database} name="database" label={t('Name of the Database')}/>
            </>
          }

          <Button sx={{ mt: 2 }}onClick={onCreate} variant="outlined"><Trans>Create</Trans></Button>

        </Box>

      </Box>
    </Box>
  )
}
