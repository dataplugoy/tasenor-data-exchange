import React, { useEffect } from 'react'
import { Box, Card, CardContent } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useGET } from '../Hooks/useNet'

export const HomePage = (): React.JSX.Element =>  {

  const { t } = useTranslation()
  const GET = useGET()

  useEffect(() => {
    GET('/api/projects').then(res => {
      console.log(res);
    })
  }, [])

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
