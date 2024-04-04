import React from 'react'
import { Box, Card, CardContent } from '@mui/material'
import { useTranslation } from 'react-i18next'

export const HomePage = (): React.JSX.Element =>  {

  const { t } = useTranslation()

  return <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
    <Card>
      <CardContent>
        TODO
      </CardContent>
    </Card>
    <Card>
      <CardContent>
        TODO
      </CardContent>
    </Card>
    <Card>
      <CardContent>
        TODO
      </CardContent>
    </Card>
  </Box>
}
