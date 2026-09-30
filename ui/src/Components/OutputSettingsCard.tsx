import React, { useState } from 'react'
import { Box, Button, Card, CardContent, CardHeader, Checkbox, TextField, Typography } from '@mui/material'
import { Setup } from '../Types/API/Setup'
import { Trans, useTranslation } from 'react-i18next'
import { Output } from '@mui/icons-material'
import { OutputDestination } from '../Types/API/OutputDestination'
import { ProcountorOutputSettings, TasenorOutputSettings } from '../Types/API/OutputDestinationSettings'
import { useApp } from '../Hooks/useApp'
import { usePATCH } from '../Hooks/useNet'

interface OutputSettingsCardProps {
  setup: Setup
  output: OutputDestination
}

type TasenorOutputSettingsCardProps = OutputSettingsCardProps & {
  onSave: (changes: Record<string, unknown>) => void
}

const TasenorOutputSettingsCard = (props: TasenorOutputSettingsCardProps): React.JSX.Element => {
  const { t } = useTranslation()
  const settings = (props.output.settings || {}) as Partial<TasenorOutputSettings>
  const [host, setHost] = useState(settings.host || '')
  const [user, setUser] = useState(settings.user || '')
  const [password, setPassword] = useState(settings.password || '')
  const [database, setDatabase] = useState(settings.database || '')
  const app = useApp()

  const onSave = () => {
    if (!host) return app.addError(t('{{field}} is required.', { field: t('Tasenor API hostname') }))
    if (!user) return app.addError(t('{{field}} is required.', { field: t('Tasenor User Email') }))
    if (!password) return app.addError(t('{{field}} is required.', { field: t('Tasenor User Password') }))
    if (!database) return app.addError(t('{{field}} is required.', { field: t('Tasenor Database') }))
    props.onSave({ host, user, password, database })
  }

  return <Box>
    <TextField sx={{ my: 0.7 }} required onChange={e => setHost(e.target.value)} fullWidth value={host} name="host" label={t('Tasenor API hostname')}/>
    <TextField sx={{ my: 0.7 }} required onChange={e => setUser(e.target.value)} fullWidth value={user} name="email" label={t('Tasenor User Email')}/>
    <TextField sx={{ my: 0.7 }} required onChange={e => setPassword(e.target.value)} fullWidth value={password} name="password" label={t('Tasenor User Password')} type={'password'}/>
    <TextField sx={{ my: 0.7 }} required onChange={e => setDatabase(e.target.value)} fullWidth value={database} name="database" label={t('Tasenor Database')}/>
    <Button onClick={onSave}><Trans>Save</Trans></Button>
  </Box>
}

type ProcountorOutputSettingsCardProps = OutputSettingsCardProps & {
  onSave: (changes: Record<string, unknown>) => void
}

const ProcountorOutputSettingsCard = (props: ProcountorOutputSettingsCardProps): React.JSX.Element => {
  const { t } = useTranslation()
  const settings = (props.output.settings || {}) as Partial<ProcountorOutputSettings>
  const [apiKey, setApiKey] = useState(settings.apiKey || '')
  const [autoApprove, setAutoApprove] = useState(!!settings.autoApprove)
  const app = useApp()

  const onSave = () => {
    if (!apiKey) return app.addError(t('{{field}} is required.', { field: t('Procountor API key') }))
    props.onSave({ apiKey, autoApprove })
  }

  return <Box>
    <TextField sx={{ my: 0.7 }} required onChange={e => setApiKey(e.target.value)} fullWidth value={apiKey} type="password" name="apiKey" label={t('Procountor API key')}/>
    <Box>
      <Checkbox checked={autoApprove} onChange={() => setAutoApprove(!autoApprove)}/> {t('Approve automatically all ledger receipts')}
    </Box>

    <Button onClick={onSave}><Trans>Save</Trans></Button>
  </Box>
}

export const OutputSettingsCard = (props: OutputSettingsCardProps): React.JSX.Element => {

  const { output } = props
  const app = useApp()
  const PATCH = usePATCH<OutputDestination>()
  const { t } = useTranslation()

  const onSave = (changes: Record<string, unknown>): void => {
    PATCH(`/output-destinations/${output.id}/settings`, changes).then(res => {
      if (res) app.addInfo(t('Bookkeeper settings saved'))
    })
  }

  return <Card>
    <CardHeader
      avatar={<Output sx={{ color: 'secondary.main', backgroundColor: 'secondary.contrastText' }}/>}
      title={<Typography variant="subtitle1"><Trans>Bookkeeping Output Settings</Trans></Typography>}
    />
    <CardContent>
      {!['TASENOR', 'PROCOUNTOR'].includes(output.type) && <Trans>This destination does not need any settings.</Trans>}
      {output.type === 'TASENOR' && <TasenorOutputSettingsCard {...props} onSave={onSave}/>}
      {output.type === 'PROCOUNTOR' && <ProcountorOutputSettingsCard {...props} onSave={onSave}/>}
    </CardContent>
  </Card>
}
