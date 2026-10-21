import React, { useEffect, useState } from 'react'
import { Box, Button, IconButton, Typography } from '@mui/material'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { Clear } from '@mui/icons-material'
import { RulesEditor } from '../Components/RulesEditor'
import { useGET, usePATCH } from '../Hooks/useNet'
import { FlowPlanRulesResponse } from '../Types/API/flow-plans/FlowPlanRulesResponse'
import { EditableRule } from '../Types/EditableRule'
import { useApp } from '../Hooks/useApp'

/**
 * Editing all rules of a flow plan as JSON.
 */
export const AdvancedRulesPage = (): React.JSX.Element => {
  const params = useParams()
  const navigate = useNavigate()
  const GET = useGET<FlowPlanRulesResponse>()
  const PATCH = usePATCH()
  const [rules, setRules] = useState<EditableRule[]>([])
  const [changed, setChanged] = useState(false)
  const app = useApp()
  const { t } = useTranslation()

  useEffect(() => {
    GET(`/flow-plans/${params.id}/rules`).then(res => {
      if (res) {
        setRules(res.map(rule => {
          const { filter, name, key, result, kind, enabled, notes, filterView, resultView } = rule
          return { filter, name, key, result, kind, enabled, notes, filterView, resultView }
        }))
      }
    })
  }, [])

  const onSave = () => {
    PATCH(`/flow-plans/${params.id}/rules`, rules).then(res => {
      if (res) {
        app.addInfo(t('Rules saved succssfully.'))
        setChanged(false)
      }
    })
  }

  const onUpdate = (data) => {
    setChanged(true)
    setRules(data)
  }

  return <Box sx={{ pb: 8 }}>
    <Typography variant="h1" sx={{ display: 'inline-block' }}>
      <IconButton sx={{ mt: -0.8 }} onClick={() => navigate(`/rules/${params.id}`)}><Clear/></IconButton> <Trans>Edit Rules as JSON</Trans>
      {changed && <Box sx={{ display: 'inline-block', color: 'error.light' }}> *</Box>}
    </Typography>

    <Box sx={{ my: 2, p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, backgroundColor: '#FFFFFF' }}>
      <RulesEditor rules={rules} onUpdate={onUpdate}/>
    </Box>

    <Button variant="contained" onClick={onSave}><Trans>Save</Trans></Button>
  </Box>
}
