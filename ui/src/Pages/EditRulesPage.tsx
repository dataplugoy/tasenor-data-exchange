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
import { FileUploadData, FileUploader } from '../Components/FileUploader'
import { error } from '@tasenor/common'

export const EditRulesPage = (): React.JSX.Element => {
  const params = useParams()
  const navigate = useNavigate()
  const GET = useGET<FlowPlanRulesResponse>()
  const PATCH = usePATCH()
  const [rules, setRules] = useState<EditableRule[]>([])
  const [changed, setChanged] = useState(false)
  const [upload, setUpload] = useState(false)
  const app = useApp()
  const { t } = useTranslation()

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

  const onUpload = async (file: FileUploadData) => {
    setUpload(false)
    let json
    try {
      json = JSON.parse(Buffer.from(file.data, 'hex').toString('utf-8'))
      setRules(json)
      setChanged(true)
    } catch (err) {
      error(err)
      app.addError(t('Failed to parse JSON-file.'))
    }
  }

  return <Box sx={{ pb: 8 }}>
    <Typography variant="h1" sx={{ display: 'inline-block' }}>
      <IconButton sx={{ mt: -0.8 }} onClick={() => navigate('/rules')}><Clear/></IconButton> <Trans>Edit Rules</Trans>
      {changed && <Box sx={{ display: 'inline-block', color: 'error.light' }}> *</Box>}
    </Typography>

    <Box sx={{ my: 2, p: 1, border: '1px solid rgba(255,255,255,0.5)' }}>
      <RulesEditor rules={rules} onUpdate={onUpdate}/>
    </Box>

    <Button variant="outlined" onClick={onDownload}><Trans>Download</Trans></Button>
    <Button sx={{ ml: 2 }} variant="outlined" onClick={() => setUpload(true)}><Trans>Upload</Trans></Button>
    <Button sx={{ ml: 4 }} variant="contained" onClick={onSave}><Trans>Save</Trans></Button>

    <FileUploader
      visible={upload}
      title={t('Rules Upload')}
      text={t('Select a JSON-file to upload')}
      onUpload={onUpload}
      onCancel={() => setUpload(false)}
      onSuccess={() => null}
    />
  </Box>
}
