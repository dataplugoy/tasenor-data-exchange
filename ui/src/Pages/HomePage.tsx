import React, { useEffect, useState } from 'react'
import { Box, Card, CardContent } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useGET } from '../Hooks/useNet'
import { ProjectsResponse } from '../Types/API/projects/ProjectsResponse'

export const HomePage = (): React.JSX.Element =>  {

  const [projects, setProjects] = useState<ProjectsResponse>([])
  const { t } = useTranslation()
  const GET = useGET<ProjectsResponse>()

  useEffect(() => {
    GET('/api/projects').then(res => {
      res && setProjects(res)
    })
  }, [])

  return <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
    <Card>
      <CardContent>
        {
          JSON.stringify(projects)
        }
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
