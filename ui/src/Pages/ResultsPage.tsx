import React, { useEffect, useState } from 'react'
import { useApp } from '../Hooks/useApp'
import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { Trans } from 'react-i18next'
import { useGET } from '../Hooks/useNet'
import { ProjectOutputResponse } from '../Types/API/projects/ProjectOutputResponse'

export const ResultsPage = (): React.JSX.Element => {
  const app = useApp()
  const [output, setOutpt] = useState<ProjectOutputResponse>([])
  const GET = useGET<ProjectOutputResponse>()

  useEffect(() => {
    GET(`/projects/${app.project.id}/output`).then(res => {
      res && setOutpt(res)
    })
  }, [])

  return <Box>
    <Typography variant="h1">
      <Trans>Project Output</Trans>
    </Typography>

    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell variant="head"><Trans>Date</Trans></TableCell>
          <TableCell variant="head"></TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
      {
        output.map(item =>
          <React.Fragment key={item.id}>
            <TableRow data-cy={`Transaction-${item.data.time}`}>
              <TableCell>{item.data.time}</TableCell>
              <TableCell>{item.data.lines.length && JSON.stringify(item.data.lines[0])}</TableCell>
            </TableRow>
            {
              item.data.lines.slice(1).map((line, idx) => <TableRow key={idx}>
                  <TableCell></TableCell>
                  <TableCell>{JSON.stringify(line)}</TableCell>
                </TableRow>)
            }
          </React.Fragment>
        )
      }
      </TableBody>
    </Table>

  </Box>
}
