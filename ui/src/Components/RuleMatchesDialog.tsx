import React, { useEffect, useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material'
import { Trans, useTranslation } from 'react-i18next'
import { useGET } from '../Hooks/useNet'
import { Rule } from '../Types/API/Rule'
import { RuleMatchesResponse } from '../Types/API/flow-plans/RuleMatchesResponse'
import { OutputDestination } from '../Types/API/OutputDestination'
import { TransactionTable } from './TransactionTable'

interface RuleMatchesDialogProps {
  flowPlanId: number
  rule: Rule | null
  onClose: () => void
}

/**
 * Show the transactions created from the lines matched by a rule.
 */
export const RuleMatchesDialog = (props: RuleMatchesDialogProps): React.JSX.Element => {
  const { flowPlanId, rule, onClose } = props
  const { t } = useTranslation()
  const GET = useGET<RuleMatchesResponse>()
  const GETOutput = useGET<OutputDestination>()
  const [matches, setMatches] = useState<RuleMatchesResponse | null>(null)
  const [output, setOutput] = useState<OutputDestination | null>(null)

  useEffect(() => {
    setMatches(null)
    if (rule) {
      GET(`/flow-plans/${flowPlanId}/rules/${rule.id}/matches`).then(res => res && setMatches(res))
      GETOutput(`/flow-plans/${flowPlanId}/output`).then(res => res && setOutput(res))
    }
  }, [flowPlanId, rule])

  return <Dialog open={rule !== null} onClose={onClose} fullWidth maxWidth="lg">
    <DialogTitle>{rule && t('Matches of the rule {{name}}', { name: rule.name })}</DialogTitle>
    <DialogContent>
      <Typography sx={{ mb: 2 }} color="text.secondary">
        <Trans>Latest transactions created from the lines matched by this rule. Lines handled before the rule matches were recorded are not listed.</Trans>
      </Typography>
      {matches && <TransactionTable txs={matches} output={output}/>}
    </DialogContent>
    <DialogActions>
      <Button variant="outlined" onClick={onClose}><Trans>Close</Trans></Button>
    </DialogActions>
  </Dialog>
}
