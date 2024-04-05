import React, { useEffect, useState } from 'react'
import { Box, Card, CardContent } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useGET } from '../Hooks/useNet'
import { ProjectsResponse } from '../Types/API/projects/ProjectsResponse'
import { ProjectsCard } from '../Components/ProjectsCard'

export const HomePage = (): React.JSX.Element =>  {

  const [projects, setProjects] = useState<ProjectsResponse>([])
  const { t } = useTranslation()
  const GET = useGET<ProjectsResponse>()

  useEffect(() => {
    GET('/projects').then(res => {
      res && setProjects(res)
    })
  }, [])

  return <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
    <ProjectsCard projects={projects}/>
  </Box>
}
