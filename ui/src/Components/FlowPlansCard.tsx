import React, { } from 'react'
import { Button, Card, CardActions, CardContent, CardHeader, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { Trans } from 'react-i18next'
import { Air } from '@mui/icons-material'
import { FlowPlan } from '../Types/API/FlowPlan'
import { useNavigate } from 'react-router-dom'

interface FlowPlansCardProps {
  plans: FlowPlan[]
}

export const FlowPlansCard = (props: FlowPlansCardProps): React.JSX.Element => {
  const { plans } = props
  const navigate = useNavigate()

  const onClickRow = (id: number) => {
    navigate(`/flow-plan/${id}`)
  }

  const onCreateNew = () => {
    navigate('/flow-plan/new')
  }

  return (
    <Card data-cy="Data Flow Plans">
      <CardHeader
        avatar={<Air sx={{ color: 'secondary.main', backgroundColor: 'secondary.contrastText' }}/>}
        title={<Typography variant="subtitle1"><Trans>Data Flow Plans</Trans></Typography>}
      />
      <CardContent>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell variant="head"><Trans>Name</Trans></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
          {
            plans.map(plan =>
              <TableRow data-cy={`FlowPlan-${plan.title}`} key={plan.id} hover onClick={() => onClickRow(plan.id)}>
                <TableCell>{plan.title}</TableCell>
              </TableRow>
            )
          }
          </TableBody>
        </Table>
      </CardContent>
      <CardActions>
        <Button onClick={onCreateNew}><Trans>Create New</Trans></Button>
      </CardActions>
    </Card>
  )
}
