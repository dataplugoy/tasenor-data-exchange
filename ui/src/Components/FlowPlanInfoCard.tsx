import React, { useState } from 'react'
import { Box, Button, Card, CardContent, CardHeader, CircularProgress, Typography } from '@mui/material'
import { Trans, useTranslation } from 'react-i18next'
import { Air, PlayArrow } from '@mui/icons-material'
import { FlowPlan } from '../Types/API/FlowPlan'
import { Project } from '../Types/API/Project'
import { useDELETE, useGET, usePATCH } from '../Hooks/useNet'
import { signalBatchDeleted, signalBatchUpdate, signalRunUpdate } from '../Signals/updates'
import { getAlert, isAlert } from '../Types/alerts'
import { UIAlert } from '../Types/Classes/UIAlert'
import { AlertHandler } from './AlertHandler'
import { BalanceData } from '../Types/API/BalanceData'
import { BalanceTable } from './BalanceTable'
import { StockData } from '../Types/API/StockData'
import { StockTable } from './StockTable'
import { Currency, Language } from '@tasenor/common'
import { Confirm } from './Confirm'

interface FlowPlanInfoProps {
  plan: FlowPlan
  project: Project
  batchId: number | null
  isCompleted: boolean
}

export const FlowPlanInfo = (props: FlowPlanInfoProps): React.JSX.Element => {
  const { plan, project, isCompleted, batchId } = props
  const [running, setRunning] = useState(false)
  const [abandoning, setAbandoning] = useState(false)
  const GET = useGET()
  const DELETE = useDELETE()
  const PATCH = usePATCH()
  const [alert, setAlert] = useState<UIAlert | null>(null)
  const [details, setDetails] = useState(false)
  const { t } = useTranslation()

  const onCancel = () => {
    signalBatchUpdate()
  }

  const onSuccess = (res) => {
    if (isAlert(res)) {
      setAlert(getAlert(res))
      signalBatchUpdate()
    } else {
      signalBatchUpdate()
    }
  }

  const onRun = async () => {
    setAlert(null)
    setRunning(true)
    const interval = setInterval(signalRunUpdate, 1000)
    const res = await GET(`/flow-plans/${plan.id}/run`)
    clearInterval(interval)
    setRunning(false)

    if (isAlert(res)) {
      setAlert(getAlert(res))
    } else {
      signalBatchUpdate()
    }
  }

  const onAbandon = async () => {
    setAbandoning(true)
  }

  const onDelete = async () => {
    await DELETE(`/batches/${batchId}`)
    signalBatchDeleted()
  }

  const onSaveStock = async (stock: StockData) => {
    // Clean up empty entries.
    Object.keys(stock).forEach(acc => {
      const newKeys = Object.keys(stock[acc]).filter(key => stock[acc][key].amount !== 0)
      const newStock = newKeys.reduce((prev, cur) => ({ ...prev, [cur]: stock[acc][cur] }), {})
      if (Object.keys(newStock).length === 0) {
        delete stock[acc]
      } else {
        stock[acc] = newStock
      }
    })

    await PATCH(`/flow-plans/${plan.id}/stock`, stock)
  }

  const onSaveBalance = async (balance: BalanceData) => {
    await PATCH(`/flow-plans/${plan.id}/balance`, balance)
  }

  // TODO: Localize number presentation.

  const balance: BalanceData = plan.balance || {}
  const stock: StockData = plan.stock || {}
  const language: Language = plan.project?.settings.language as Language || 'en'
  const currency: Currency = plan.project?.settings.currency as Currency || 'EUR'

  return (
    <>
      <Card>
        <CardHeader
          avatar={<Air sx={{ color: 'secondary.main', backgroundColor: 'secondary.contrastText' }}/>}
          title={<Typography variant="subtitle1"><Trans>Data Flow Plan</Trans>: {plan.title}</Typography>}
        />
        <CardContent>
          <Box sx={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <Box>
              <Button
                variant="contained"
                onClick={onRun}
                disabled={running}
                endIcon={running ? <CircularProgress color="inherit" size={'1rem'}/> : <PlayArrow/>}
              >
                {isCompleted ? <Trans>Run</Trans> : <Trans>Retry</Trans>}
              </Button>

              <Button
                variant="outlined"
                color="error"
                disabled={running || isCompleted || !batchId}
                sx={{ ml: 2 }}
                onClick={onAbandon}
              >
                <Trans>Abandon</Trans>
              </Button>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary"><Trans>Project</Trans></Typography>
              <Typography>{project.name}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary"><Trans>Currency</Trans></Typography>
              <Typography>{project.settings?.currency}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary"><Trans>Language</Trans></Typography>
              <Typography>{project.settings?.language}</Typography>
            </Box>
          </Box>

          {!details &&
            <Box sx={{ mt: 3, color: 'primary.main', cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => setDetails(true)}>
              <Trans>Show details</Trans>
            </Box>
          }

          {details &&
            <Box sx={{ mt: 3, color: 'primary.main', cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => setDetails(false)}>
              <Trans>Hide details</Trans>
            </Box>
          }

          {details && <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>

            <BalanceTable currency={currency} language={language} balance={balance} footer={t('Current balance of all accounts according to our records.')} onSave={onSaveBalance}/>
            <StockTable currency={currency} language={language} stock={stock} footer={t('Current assets of all accounts according to our records.')} onSave={onSaveStock}/>

          </Box>}
        </CardContent>
      </Card>

      {alert && <AlertHandler alert={alert} onCancel={onCancel} onSuccess={onSuccess}/>}

      <Confirm open={abandoning} areYouSure title={t('Abandon the Latest Batch')} okText={t('Delete')} onClose={() => setAbandoning(false)} onSubmit={onDelete}>
        <Trans>This will remove all data retrieved during the processing.</Trans>
      </Confirm>
    </>
  )
}
