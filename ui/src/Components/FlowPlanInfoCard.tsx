import React, { useState } from 'react'
import { Box, Button, Card, CardContent, CardHeader, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { Trans } from 'react-i18next'
import { Air, PlayArrow } from '@mui/icons-material'
import { FlowPlan } from '../Types/API/FlowPlan'
import { Project } from '../Types/API/Project'
import { useDELETE, useGET } from '../Hooks/useNet'
import { signalBatchDeleted, signalBatchUpdate, signalRunUpdate } from '../Signals/updates'
import { getAlert, isAlert } from '../Types/alerts'
import { UIAlert } from '../Types/Classes/UIAlert'
import { AlertHandler } from './AlertHandler'
import { sprintf } from 'sprintf-js'

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
  const [alert, setAlert] = useState<UIAlert|null>(null)
  const [details, setDetails] = useState(false)

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
    setAbandoning(false)
    await DELETE(`/batches/${batchId}`)
    signalBatchDeleted()
  }

  // TODO: Move balance table to separate component.
  // TODO: Move stock table to separate component.
  // TODO: Localize number presentation.

  const balance: Record<string, number> = plan.balance as Record<string, number> || {}
  const stock: Record<string, Record<string, { value: number, amount: number }>> = plan.stock as Record<string, Record<string, { value: number, amount: number }>> || {}

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
                sx={{ backgroundColor: 'secondary.main', color: 'secondary.contrastText' }}
                variant="outlined"
                onClick={onRun}
                disabled={running}
              >
                {isCompleted ? <Trans>Run</Trans> : <Trans>Retry</Trans>}
                {running ? <CircularProgress sx={{ ml: '0.2rem' }}color="primary" size={'1rem'}/> : <PlayArrow/> }
              </Button>

              <Button
                variant="contained"
                disabled={isCompleted || !batchId}
                sx={{ ml: 2, backgroundColor: 'error.dark', color: 'error.contrastText' }}
                onClick={onAbandon}
              >
                <Trans>Abandon</Trans>
              </Button>
            </Box>
            <Box>
              <Typography variant="subtitle1"><Trans>Project</Trans>: {project.name}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle1"><Trans>Currency</Trans>: {project.settings?.currency}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle1"><Trans>Language</Trans>: {project.settings?.language}</Typography>
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
            <Box sx={{ minWidth: '25rem' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell variant="head"><Trans>Account</Trans></TableCell>
                    <TableCell variant="head" align="right"><Trans>Balance</Trans></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {
                    Object.keys(balance).length === 0 &&
                    <TableRow>
                      <TableCell colSpan={3}>
                        <Trans>No transactions</Trans>
                      </TableCell>
                    </TableRow>
                  }
                  {
                    Object.keys(balance).map(acc =>
                      <TableRow key={acc}>
                        <TableCell>{acc}</TableCell>
                        <TableCell align="right">{balance[acc]}</TableCell>
                      </TableRow>
                    )
                  }
                </TableBody>
              </Table>
              <Box sx={{ mt: 1 }}><Trans>Current balance of all accounts according to our records.</Trans></Box>
            </Box>

            <Box sx={{ minWidth: '25rem' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell variant="head"><Trans>Account</Trans></TableCell>
                    <TableCell variant="head"><Trans>Asset</Trans></TableCell>
                    <TableCell variant="head" align="right"><Trans>Units</Trans></TableCell>
                    <TableCell variant="head" align="right"><Trans>Value</Trans></TableCell>
                    <TableCell variant="head" align="right"><Trans>Unit Value</Trans></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {
                    Object.keys(stock).length === 0 &&
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Trans>No assets</Trans>
                      </TableCell>
                    </TableRow>
                  }
                  {
                    Object.keys(stock).map(acc => Object.keys(stock[acc]).map(ticker =>
                      <TableRow key={acc}>
                        <TableCell>{acc}</TableCell>
                        <TableCell>{ticker}</TableCell>
                        <TableCell align="right">{stock[acc][ticker].amount}</TableCell>
                        <TableCell align="right">{stock[acc][ticker].value}</TableCell>
                        <TableCell align="right">{stock[acc][ticker].amount ? sprintf('%.2f', stock[acc][ticker].value / stock[acc][ticker].amount) : <>&mdash;</>}</TableCell>
                      </TableRow>
                    ))
                  }
                </TableBody>
              </Table>
              <Box sx={{ mt: 1 }}><Trans>Current assets of all accounts according to our records.</Trans></Box>
            </Box>
          </Box>}
        </CardContent>
      </Card>

      {alert && <AlertHandler alert={alert} onCancel={onCancel} onSuccess={onSuccess}/>}

      <Dialog open={abandoning} fullWidth>
        <DialogTitle><Trans>Abandon the Latest Batch</Trans></DialogTitle>

        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            <Trans>This will remove all data retrieved during the processing.</Trans><> </>
            <Box component="span" sx={{ fontWeight: 'bold' }}>
              <Trans sx={{}}>Are You sure?</Trans>
            </Box>
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button data-cy="DialogButton-Cancel" variant="outlined" onClick={() => setAbandoning(false)}><Trans>Cancel</Trans></Button>
          <Button data-cy="DialogButton-Abandon" onClick={onDelete}><Trans>Delete</Trans></Button>
        </DialogActions>
      </Dialog>

    </>
  )
}
