import React, { useState } from 'react'
import { Box, IconButton, Typography } from '@mui/material'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { Clear } from '@mui/icons-material'
import { useApp } from '../Hooks/useApp'
import { JsonEditor } from 'json-edit-react'

export const RulesEditor = (): React.JSX.Element => {
  const params = useParams()
  const navigate = useNavigate()
  const app = useApp()
  const { t } = useTranslation()
  const [data, setData] = useState({a: 22})

return <Box>
    <JsonEditor
      data={ data }
      onUpdate={ ({newData} ) => { setData(newData) }}
    />
  </Box>
}
