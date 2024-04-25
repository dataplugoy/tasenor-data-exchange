import React, { useState } from 'react'
import { Box, Button, TextField, Typography } from '@mui/material'
import { Trans, useTranslation } from 'react-i18next'

export const CreateFlowPlanPage = (): React.JSX.Element => {

  const { t } = useTranslation()
  const [name, setName] = useState('')

  const onCreate = () => {
  }


  return (
    <Box>
      <Typography variant="h1" textAlign="center">
        <Trans>Create Flow Plan</Trans>
      </Typography>

      <Box sx={{ mt: 5, textAlign: 'center', ml: '35%' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '50%', rowGap: '1rem' }}>
          <TextField autoComplete="off" required fullWidth onChange={e => setName(e.target.value)} value={name} name="email" label={t('Name')}/>

          <Box>TODO: Input</Box>
          <Box>TODO: Output</Box>

          <Button sx={{ mt: 2 }}onClick={onCreate} variant="outlined"><Trans>Create</Trans></Button>

        </Box>

      </Box>
    </Box>
  )
}
