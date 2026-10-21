import React, { useEffect, useState } from 'react'
import { Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, FormGroup, FormLabel, MenuItem, Stack, Switch, TextField } from '@mui/material'
import { Trans, useTranslation } from 'react-i18next'
import { Service } from '../Types/API/Service'
import { ServiceDriver } from '../Types/API/ServiceDriver'
import { ServiceType } from '../Types/API/ServiceType'
import { SaveServiceRequest } from '../Types/API/services/SaveServiceRequest'
import { usePATCH, usePOST } from '../Hooks/useNet'

export const SERVICE_DRIVERS: ServiceDriver[] = ['TASENOR', 'ECB_RATES', 'COINBASE_PRICES', 'OPEN_FIGI', 'JSON_FILE']

// Capabilities each driver provides.
const DRIVER_CAPABILITIES: Record<ServiceDriver, ServiceType[]> = {
  TASENOR: ['CURRENCY_RATES', 'CRYPTO_RATES'],
  COINBASE_PRICES: ['CRYPTO_RATES'],
  ECB_RATES: ['CURRENCY_RATES'],
  OPEN_FIGI: ['TICKERS'],
  JSON_FILE: ['CURRENCY_RATES', 'CRYPTO_RATES'],
}

// Default URLs for the drivers.
const DEFAULT_URL: Record<ServiceDriver, string> = {
  TASENOR: 'https://bookkeeper-api.tasenor.com',
  OPEN_FIGI: 'https://api.openfigi.com',
  JSON_FILE: 'file:///rates.json',
  COINBASE_PRICES: 'https://api.exchange.coinbase.com',
  ECB_RATES: 'https://data-api.ecb.europa.eu',
}

interface ServiceDialogProps {
  open: boolean
  // Service to edit, or null for a new service.
  service: Service | null
  onClose: () => void
  onSaved: (service: Service) => void
}

/**
 * Dialog for creating and editing an external service. Secrets are never shown: an empty field keeps the saved one.
 */
export const ServiceDialog = (props: ServiceDialogProps): React.JSX.Element => {
  const { open, service, onClose, onSaved } = props
  const { t } = useTranslation()
  const POST = usePOST<Service>()
  const PATCH = usePATCH<Service>()
  const [name, setName] = useState('')
  const [driver, setDriver] = useState<ServiceDriver>('TASENOR')
  const [url, setUrl] = useState('')
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  const [key, setKey] = useState('')
  const [free, setFree] = useState(false)
  const [capabilities, setCapabilities] = useState<ServiceType[]>(DRIVER_CAPABILITIES.TASENOR)

  useEffect(() => {
    if (!open) return
    setName(service ? service.name : '')
    setDriver(service ? service.driver : 'TASENOR')
    setUrl(service ? service.url : DEFAULT_URL.TASENOR)
    setUser(service ? service.user : '')
    setPassword('')
    setKey('')
    setFree(service ? service.free : false)
    setCapabilities(service ? service.capabilities : DRIVER_CAPABILITIES.TASENOR)
  }, [open, service])

  const onChangeDriver = (value: ServiceDriver) => {
    if (url === '' || url === DEFAULT_URL[driver]) {
      setUrl(DEFAULT_URL[value])
    }
    setDriver(value)
    setCapabilities(DRIVER_CAPABILITIES[value])
  }

  const available = DRIVER_CAPABILITIES[driver]

  const toggleCapability = (capability: ServiceType, on: boolean) => {
    setCapabilities(on ? available.filter(c => c === capability || capabilities.includes(c)) : capabilities.filter(c => c !== capability))
  }

  const onSave = async () => {
    const request: SaveServiceRequest = { name, driver, url, free, capabilities }
    if (driver === 'TASENOR') {
      request.user = user
      if (password !== '') request.password = password
    }
    if (driver === 'OPEN_FIGI' && key !== '') {
      request.key = key
    }
    const saved = service
      ? await PATCH(`/services/${service.id}`, request as unknown as Record<string, unknown>)
      : await POST('/services', request as unknown as Record<string, unknown>)
    if (saved) {
      onSaved(saved)
    }
  }

  const complete = name.trim() !== '' && url.trim() !== '' && capabilities.length > 0 && (driver !== 'TASENOR' || (user.trim() !== '' && (password !== '' || !!service?.hasPassword)))

  return <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
    <DialogTitle>{service ? <Trans>Edit Service</Trans> : <Trans>New Service</Trans>}</DialogTitle>
    <DialogContent>
      <Stack spacing={2} sx={{ mt: 1 }}>
        <TextField label={t('Name')} value={name} onChange={e => setName(e.target.value)} data-cy="ServiceName" autoComplete="off"/>
        <TextField select label={t('Service')} value={driver} onChange={e => onChangeDriver(e.target.value as ServiceDriver)} data-cy="ServiceDriver">
          {SERVICE_DRIVERS.map(d => <MenuItem key={d} value={d}>{t(`SERVICE_DRIVER_${d}`)}</MenuItem>)}
        </TextField>
        <TextField label={t('URL')} value={url} onChange={e => setUrl(e.target.value)} data-cy="ServiceUrl" autoComplete="off"/>
        {driver === 'TASENOR' && <>
          <TextField label={t('User')} value={user} onChange={e => setUser(e.target.value)} data-cy="ServiceUser" autoComplete="off"/>
          <TextField
            type="password"
            label={t('Password')}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={service?.hasPassword ? t('Saved, leave empty to keep') : ''}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { autoComplete: 'new-password' } }}
            data-cy="ServicePassword"
          />
        </>}
        {driver === 'OPEN_FIGI' &&
          <TextField
            type="password"
            label={t('API key')}
            value={key}
            onChange={e => setKey(e.target.value)}
            placeholder={service?.hasKey ? t('Saved, leave empty to keep') : ''}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { autoComplete: 'new-password' } }}
            data-cy="ServiceKey"
          />
        }
        {available.length > 1 &&
          <Box>
            <FormLabel><Trans>Use for</Trans></FormLabel>
            <FormGroup row data-cy="ServiceCapabilities">
              {available.map(c =>
                <FormControlLabel
                  key={c}
                  control={<Checkbox checked={capabilities.includes(c)} onChange={e => toggleCapability(c, e.target.checked)} data-cy={`Capability-${c}`}/>}
                  label={t(`SERVICE_TYPE_${c}`)}
                />
              )}
            </FormGroup>
          </Box>
        }
        <FormControlLabel
          control={<Switch checked={free} onChange={e => setFree(e.target.checked)}/>}
          label={t('Free service, also used by the command line tool')}
        />
      </Stack>
    </DialogContent>
    <DialogActions>
      <Button variant="outlined" onClick={onClose}><Trans>Cancel</Trans></Button>
      <Button variant="contained" disabled={!complete} onClick={onSave} data-cy="SaveService"><Trans>Save</Trans></Button>
    </DialogActions>
  </Dialog>
}
