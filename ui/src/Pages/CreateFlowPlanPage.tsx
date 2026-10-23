import React, { useEffect, useState } from 'react'
import { Box, Button, MenuItem, TextField, Typography } from '@mui/material'
import { Trans, useTranslation } from 'react-i18next'
import { useApp } from '../Hooks/useApp'
import { useGET, usePOST } from '../Hooks/useNet'
import { CreateFlowPlanResponse } from '../Types/API/flow-plans/CreateFlowPlanResponse'
import { FlowPlansResponse } from '../Types/API/flow-plans/FlowPlansResponse'
import { FlowPlan } from '../Types/API/FlowPlan'
import { useNavigate } from 'react-router-dom'
import { DatePicker } from '@mui/x-date-pickers'
import { DateTime } from 'luxon'

const DEFAULTS: Record<string, Record<string, unknown>> = {
  NORDNET: {
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
  const [firstDate, setFirstDate] = useState<DateTime | null>(DateTime.fromISO('1970-01-01'))
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('NO_ACTION')
  const [copyOutputFrom, setCopyOutputFrom] = useState<number | ''>('')
  const [plans, setPlans] = useState<FlowPlan[]>([])
  const [fileUrl, setFileUrl] = useState('file:///')
  const [hostUrl, setHostUrl] = useState('https://')
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  const [database, setDatabase] = useState('')
  const [apiKey, setApiKey] = useState('')

  const app = useApp()
  const POST = usePOST<CreateFlowPlanResponse>()
  const GET = useGET<FlowPlansResponse>()
  const navigate = useNavigate()

  useEffect(() => {
    GET('/flow-plans').then(res => {
      res && setPlans(res.filter(plan => plan.projectId === app.project.id))
    })
  }, [app.project.id])

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
    if (output === 'PROCOUNTOR') {
      if (!apiKey) return app.addError('API Key is required.')
      return {
        apiKey
      }
    }

    return {}
  }

  const onCreate = async () => {

    if (!firstDate || !firstDate.isValid) return app.addError(t('Valid starting date is required.'))
    if (!title) return app.addError(t('Name is required.'))
    if (!input) return app.addError(t('Data source must be selected.'))

    const sourceSettings = validateSourceSettings()
    const destinationSettings = copyOutputFrom === '' ? validateDestinationSettings() : {}

    if (!sourceSettings || !destinationSettings) {
      return
    }

    const data: Record<string, unknown> & { setup: Record<string, unknown> } = {
      title,
      firstDate: firstDate.toISODate(),
      projectId: app.project.id,
      source: {
        type: input,
        settings: sourceSettings,
      },
      setup: {
      }
    }
    if (copyOutputFrom === '') {
      data.destination = {
        type: output,
        settings: destinationSettings,
      }
    } else {
      data.copyOutputFrom = copyOutputFrom
    }

    if (DEFAULTS[input]) {
      Object.assign(data.setup, DEFAULTS[input])
    }
    if (copyOutputFrom === '' && DEFAULTS[output]) {
      Object.assign(data.setup, DEFAULTS[output])
    }

    const res = await POST('/flow-plans', data)
    res && navigate(`/flow-plans/${res.id}`)
  }

  return (
    <Box>
      <Typography variant="h1" sx={{ textAlign: 'center' }}>
        <Trans>Create Flow Plan</Trans>
      </Typography>

      <Box sx={{ mt: 5, textAlign: 'center', ml: '35%' }}>
        <Box sx={{ display: 'grid', textAlign: 'left', gridTemplateColumns: '50%', rowGap: '1rem' }}>
          <TextField autoComplete="off" required fullWidth onChange={e => setTitle(e.target.value)} value={title} name="name" label={t('Name')}/>

          <DatePicker label={t('Ignore older events than this date')} value={firstDate} onChange={date => setFirstDate(date)}/>

          <TextField data-cy="Data Source" select label={t('Data Source')} value={input} onChange={e => setInput(e.target.value)}>
            {

              NODE_ENV !== 'prod' && NODE_ENV !== 'stg' && <MenuItem value="TEST_MOCK"><Trans>Fixed Test File</Trans></MenuItem>
            }
            <MenuItem value="ENABLE_BANKING"><Trans>Enable Banking Service</Trans></MenuItem>
            <MenuItem value="NORDNET"><Trans>Upload Nordnet Statement</Trans></MenuItem>
            <MenuItem value="S_PANKKI"><Trans>Upload S-Pankki Statement</Trans></MenuItem>
            <MenuItem value="NORDEA_TITO"><Trans>Upload Nordea TITO Statement</Trans></MenuItem>
            <MenuItem value="LYNX"><Trans>Upload Lynx Activity Statement</Trans></MenuItem>
            <MenuItem value="COINBASE"><Trans>Upload Coinbase Transaction Report</Trans></MenuItem>
          </TextField>

          {
            input === 'TEST_MOCK' && <>
              <TextField autoComplete="off" required fullWidth onChange={e => setFileUrl(e.target.value)} value={fileUrl} name="fileUrl" label={t('File URL')}/>
            </>
          }

          {
            plans.length > 0 &&
            <TextField select label={t('Copy Bookkeeping Destination From')} value={copyOutputFrom} onChange={e => setCopyOutputFrom(e.target.value === '' ? '' : Number(e.target.value))}>
              <MenuItem value=""><Trans>Do not copy</Trans></MenuItem>
              {plans.map(plan => <MenuItem key={plan.id} value={plan.id}>{plan.title}</MenuItem>)}
            </TextField>
          }

          {
            copyOutputFrom === '' &&
            <TextField select label={t('Bookkeeping Destination')} value={output} onChange={e => setOutput(e.target.value)}>
              {

                NODE_ENV !== 'prod' && NODE_ENV !== 'stg' && <MenuItem value="TEST_MOCK">Fixed Test Files</MenuItem>
              }
              <MenuItem value="NO_ACTION"><Trans>Keep results in TaDeX</Trans></MenuItem>
              <MenuItem value="TASENOR"><Trans>Upload results to Tasenor</Trans></MenuItem>
              <MenuItem value="PROCOUNTOR"><Trans>Upload results to Procountor</Trans></MenuItem>
            </TextField>
          }

          {
            copyOutputFrom === '' && output === 'TASENOR' && <>
              <TextField autoComplete="off" required fullWidth onChange={e => setHostUrl(e.target.value)} value={hostUrl} name="url" label={t('Tasenor Server API URL')}/>
              <TextField autoComplete="off" required fullWidth onChange={e => setUser(e.target.value)} value={user} name="user" label={t('Login Email')}/>
              <TextField autoComplete="off" required fullWidth onChange={e => setPassword(e.target.value)} value={password} name="password" label={t('Password')} type="password"/>
              <TextField autoComplete="off" required fullWidth onChange={e => setDatabase(e.target.value)} value={database} name="database" label={t('Name of the Database')}/>
            </>
          }

          {
            copyOutputFrom === '' && output === 'PROCOUNTOR' && <>
              <TextField autoComplete="off" required fullWidth onChange={e => setApiKey(e.target.value)} value={apiKey} name="apiKey" label={t('Procountor API key')}/>
            </>
          }

          <Button sx={{ mt: 2 }} onClick={onCreate} variant="contained"><Trans>Create</Trans></Button>

        </Box>

      </Box>
    </Box>
  )
}
