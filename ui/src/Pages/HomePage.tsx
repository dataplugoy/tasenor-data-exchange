import React, { useState } from 'react'
import { Box, Button, Paper, TextField } from '@mui/material'
import { Trans, useTranslation } from 'react-i18next'
import axios from 'axios'
import { useApp } from '../Hooks/useApp'
import { useNavigate } from 'react-router-dom'

export const HomePage = (): React.JSX.Element =>  {

  const { t } = useTranslation()

  return <Box>
    <Paper sx={{ color: 'primary.main' }}>
      Home
    </Paper>
  </Box>
}
