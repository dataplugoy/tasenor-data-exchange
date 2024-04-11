import React, { useEffect, useState } from 'react'
import { Box } from '@mui/material'
import { useGET } from '../Hooks/useNet'
import { ProjectsResponse } from '../Types/API/projects/ProjectsResponse'
import { ProjectsCard } from '../Components/ProjectsCard'
import { useApp } from '../Hooks/useApp'
import { ProjectResponse } from '../Types/API/projects/ProjectResponse'
import { FlowPlan } from '../Types/API/FlowPlan'
import { FlowPlansCard } from '../Components/FlowPlansCard'

export const HomePage = (): React.JSX.Element => {

  const [projects, setProjects] = useState<ProjectsResponse>([])
  const [flowPlans, setFlowPlans] = useState<FlowPlan[]>([])

  const GET = useGET<ProjectsResponse>()
  const GET1 = useGET<ProjectResponse>()
  const app = useApp()

  useEffect(() => {
    GET('/projects').then(res => {
      res && setProjects(res)
    })
    GET1(`/projects/${app.auth.user.settings.projectId}`).then((res) => {
      res && res.plans && setFlowPlans(res.plans)
    })
  }, [])

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
      <ProjectsCard projects={projects}/>
      <FlowPlansCard plans={flowPlans}/>
    </Box>
  )
}
