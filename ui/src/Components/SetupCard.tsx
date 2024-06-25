import React, { useEffect, useState } from 'react'
import { Button, Card, CardContent, CardHeader, Typography } from '@mui/material'
import { Setup } from '../Types/API/Setup'
import { Trans, useTranslation } from 'react-i18next'
import { Settings as SettingsIcon } from '@mui/icons-material'
import { OutputDestination } from '../Types/API/OutputDestination'
import { useApp } from '../Hooks/useApp'
import { useGET, usePATCH } from '../Hooks/useNet'
import { Question } from '../Types/API/Question'
import { QuestionPanel } from './QuestionPanel'
import { Settings } from '../Types/API/Settings'

interface SetupCardProps {
  setup: Setup
  output: OutputDestination
}

export const SetupCard = (props: SetupCardProps): React.JSX.Element => {

  const { setup, output } = props
  const app = useApp()
  const PATCH = usePATCH<OutputDestination>()
  const { t } = useTranslation()
  const GET = useGET<Question[]>()
  const [questions, setQuestions] = useState<Question[]>([])
  const [values, setValues] = useState<Settings>(setup.settings || {})

  useEffect(() => {
    GET('/questions').then(res => {
      if (res) {
        res = res.sort((a, b) => (a.type < b.type ? -1 : a.type > b.type ? 1 : 0))
        setQuestions(res)
      }
    })
  }, [])

  const onSave = (): void => {
    PATCH(`/flow-plans/${output.flowPlanId}/setup`, { ...setup, settings: values }).then(res => {
      if (res) app.addInfo(t('Flow plan setup saved'))
    })
  }

  const onChange = (variable: string, value: unknown) => {
    setValues({ ...values, [variable]: value })
  }

  return <Card>
    <CardHeader
      avatar={<SettingsIcon sx={{ color: 'secondary.main', backgroundColor: 'secondary.contrastText' }}/>}
      title={<Typography variant="subtitle1"><Trans>Flow Plan Setup</Trans></Typography>}
    />
    <CardContent>
      {
        questions.map((question, idx) =>
          <QuestionPanel sx={{ mb: 2 }} noHelp onChange={onChange} key={idx} remotes={{}} question={question} value={values[question.variable]}/>
        )
      }
      <Button onClick={onSave}><Trans>Save</Trans></Button>
    </CardContent>
  </Card>
}
