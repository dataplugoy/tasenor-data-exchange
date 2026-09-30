import React, { useEffect, useState } from 'react'
import { Box, Button, Chip, IconButton, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { Add, Delete, Edit, NetworkCheck } from '@mui/icons-material'
import { Trans, useTranslation } from 'react-i18next'
import { Service } from '../Types/API/Service'
import { ServicesResponse } from '../Types/API/services/ServicesResponse'
import { TestServiceResponse } from '../Types/API/services/TestServiceResponse'
import { useDELETE, useGET, usePOST } from '../Hooks/useNet'
import { ServiceDialog } from '../Components/ServiceDialog'
import { Confirm } from '../Components/Confirm'

/**
 * External services of the user, like exchange rates, used when processing the flow plans.
 */
export const ServicesPage = (): React.JSX.Element => {
  const { t } = useTranslation()
  const GET = useGET<ServicesResponse>()
  const POST = usePOST<TestServiceResponse>()
  const DELETE = useDELETE()
  const [services, setServices] = useState<ServicesResponse>([])
  const [editing, setEditing] = useState<Service | null>(null)
  const [dialog, setDialog] = useState(false)
  const [deleting, setDeleting] = useState<Service | null>(null)
  const [testing, setTesting] = useState<number | null>(null)
  const [tests, setTests] = useState<Record<number, TestServiceResponse>>({})

  const load = () => GET('/services').then(res => res && setServices(res))

  useEffect(() => { load() }, [])

  const onTest = async (service: Service) => {
    setTesting(service.id)
    const res = await POST(`/services/${service.id}/test`, {})
    setTesting(null)
    if (res) {
      setTests({ ...tests, [service.id]: res })
    }
  }

  const onDelete = async () => {
    if (deleting) {
      await DELETE(`/services/${deleting.id}`)
      await load()
    }
  }

  return <Box>
    <Typography variant="h1">
      <Trans>Services</Trans>
    </Typography>
    <Typography sx={{ mt: 1, mb: 2 }}>
      <Trans>External services are used when processing the flow plans, for example to find exchange rates not given in the imported files.</Trans>
    </Typography>

    <Button variant="outlined" startIcon={<Add/>} onClick={() => { setEditing(null); setDialog(true) }} data-cy="AddService">
      <Trans>Add Service</Trans>
    </Button>

    <Table size="small" sx={{ mt: 2 }} data-cy="Services">
      <TableHead>
        <TableRow>
          <TableCell><Trans>Name</Trans></TableCell>
          <TableCell><Trans>Service</Trans></TableCell>
          <TableCell><Trans>Provides</Trans></TableCell>
          <TableCell><Trans>URL</Trans></TableCell>
          <TableCell><Trans>User</Trans></TableCell>
          <TableCell></TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {services.length === 0 &&
          <TableRow><TableCell colSpan={6}><Trans>No services.</Trans></TableCell></TableRow>
        }
        {services.map(service => <React.Fragment key={service.id}>
          <TableRow data-cy={`Service-${service.name}`}>
            <TableCell>{service.name}{service.free && <Chip size="small" sx={{ ml: 1 }} label={t('Free')}/>}</TableCell>
            <TableCell>{t(`SERVICE_DRIVER_${service.driver}`)}</TableCell>
            <TableCell>{service.capabilities.map(c => <Chip key={c} size="small" sx={{ mr: 0.5 }} label={t(`SERVICE_TYPE_${c}`)}/>)}</TableCell>
            <TableCell>{service.url}</TableCell>
            <TableCell>{service.user}</TableCell>
            <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
              <IconButton size="small" title={t('Test')} disabled={testing === service.id} onClick={() => onTest(service)} data-cy="TestService"><NetworkCheck fontSize="small"/></IconButton>
              <IconButton size="small" title={t('Edit')} onClick={() => { setEditing(service); setDialog(true) }} data-cy="EditService"><Edit fontSize="small"/></IconButton>
              <IconButton size="small" title={t('Delete')} onClick={() => setDeleting(service)} data-cy="DeleteService"><Delete fontSize="small"/></IconButton>
            </TableCell>
          </TableRow>
          {tests[service.id] && tests[service.id].map(test =>
            <TableRow key={test.capability} data-cy={`ServiceTest-${test.capability}`}>
              <TableCell></TableCell>
              <TableCell colSpan={5} sx={{ color: test.success ? 'success.main' : 'error.main' }}>
                {t(`SERVICE_TYPE_${test.capability}`)}: {test.query} {test.success ? `= ${test.result}` : `: ${test.error || t('No answer.')}`}
              </TableCell>
            </TableRow>
          )}
        </React.Fragment>)}
      </TableBody>
    </Table>

    <ServiceDialog
      open={dialog}
      service={editing}
      onClose={() => setDialog(false)}
      onSaved={() => { setDialog(false); load() }}
    />

    <Confirm
      open={deleting !== null}
      title={t('Delete Service')}
      areYouSure
      onClose={() => setDeleting(null)}
      onSubmit={onDelete}
    >
      {deleting && t('Delete the service {{name}}?', { name: deleting.name })}
    </Confirm>
  </Box>
}
