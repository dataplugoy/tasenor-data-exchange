import React, {  } from 'react'
import { Card, CardContent, CardHeader, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { ProjectsResponse } from '../Types/API/projects/ProjectsResponse'
import { Trans } from 'react-i18next'
import { AccountTree, Check } from '@mui/icons-material'
import { useApp } from '../Hooks/useApp'

interface ProjectsCardProps {
  projects: ProjectsResponse
}

export const ProjectsCard = (props: ProjectsCardProps): React.JSX.Element =>  {
  const { projects } = props
  const app = useApp()

  return (
    <Card>
      <CardHeader
        avatar={<AccountTree sx={{ color: 'secondary.main', backgroundColor: 'secondary.contrastText' }}/>}
        title={<Typography variant="subtitle1"><Trans>Projects</Trans></Typography>}
      />
      <CardContent>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell variant="head"><Trans>Name</Trans></TableCell>
              <TableCell variant="head" width="10rem"><Trans>Current</Trans></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
          {
            projects.map(project =>
              <TableRow key={project.id} hover selected={app.project.id === project.id}>
                <TableCell>{project.name}</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>{app.project.id === project.id && <Check sx={{ color: 'success.main' }}/>}</TableCell>
              </TableRow>
            )
          }
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
