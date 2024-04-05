import React, {  } from 'react'
import { Box, Card, CardContent, CardHeader, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { ProjectsResponse } from '../Types/API/projects/ProjectsResponse'
import { Trans } from 'react-i18next'
import { AccountTree, Check } from '@mui/icons-material'

interface ProjectsCardProps {
  projects: ProjectsResponse
}

export const ProjectsCard = (props: ProjectsCardProps): React.JSX.Element =>  {
  const { projects } = props

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
              <TableCell variant="head"><Trans>Current</Trans></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
          {
            projects.map(project =>
              <TableRow key={project.id} hover selected>
                <TableCell>{project.name}</TableCell>
                <TableCell><Check sx={{ color: 'success.main' }}/></TableCell>
              </TableRow>
            )
          }
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
