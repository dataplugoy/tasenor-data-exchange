import React, { useEffect, useState } from 'react'
import { Box, Button, IconButton, Typography } from '@mui/material'
import { Trans } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { Clear } from '@mui/icons-material'
import { RulesEditor } from '../Components/RulesEditor'
import { useGET } from '../Hooks/useNet'
import { FlowPlanRulesResponse } from '../Types/API/flow-plans/FlowPlanRulesResponse'
import { EditableRule } from '../Types/EditableRule'

export const EditRulesPage = (): React.JSX.Element => {
  const params = useParams()
  const navigate = useNavigate()
  const GET = useGET<FlowPlanRulesResponse>()
  const [rules, setRules] = useState<EditableRule[]>([])

  useEffect(() => {
    GET(`/flow-plans/${params.id}/rules`).then(res => {
      if (res) {
        setRules(res.map(rule => {
          const { filter, name, key, result } = rule
          return { filter, name, key, result }
        }))
      }
    })
  }, [])

  const onSave = () => {
    // TODO: Saving.
  }

  const onDownload = () => {
    const blob = new Blob([JSON.stringify(rules, null, 2)], { type: 'application/json;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'rules.json')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return <Box sx={{ pb: 8 }}>
    <Typography variant="h1" sx={{ display: 'inline-block' }}>
      <IconButton sx={{ mt: -0.8 }} onClick={() => navigate('/rules')}><Clear/></IconButton> <Trans>Edit Rules</Trans>
    </Typography>

    <Box sx={{ my: 2, p: 1, border: '1px solid rgba(255,255,255,0.5)' }}>
      <RulesEditor rules={rules} onUpdate={(data) => setRules(data)}/>
    </Box>

    <Button variant="outlined" onClick={onDownload}><Trans>Download</Trans></Button>
    <Button sx={{ ml: 2 }} variant="outlined" onClick={onSave}><Trans>Save</Trans></Button>
  </Box>
}
