import React from 'react'
import { Box } from '@mui/material'
import { Trans } from 'react-i18next'
import { RemoteId } from '../Types/API/RemoteId'
import { TasenorOutputSettings } from '../Types/API/OutputDestinationSettings'
import { OutputDestination } from '../Types/API/OutputDestination'

interface TransactionRemoteIdProps {
  id: RemoteId | null
  output: OutputDestination
}

export const TransactionRemoteId = (props: TransactionRemoteIdProps): React.JSX.Element => {
  const { id, output } = props

  if (id === null) return <></>

  switch (id.type) {
    case 'TRIVIAL':
      return <></>
    case 'ID':
      return <><Trans>Transaction ID:</Trans> {id.id}</>
    case 'FILE':
      return <><Trans>Saved to file:</Trans> {id.path}</>
    case 'TASENOR':
      return <><Trans>Tasenor document API URL:</Trans>
        <Box sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{`${(output.settings as TasenorOutputSettings).host}/db/${(output.settings as TasenorOutputSettings).database}/document/${id.doc}`}</Box>
      </>
    default:
      throw new Error(`Rendering remote ID ${JSON.stringify(id)} not implemented.`)
  }
}
