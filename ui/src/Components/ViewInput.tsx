import { Box } from '@mui/material'
import React from 'react'
import { ResultInputItem } from '../Helpers/sorter'
import clone from 'clone'
import { InputItemData } from '../Types/API/InputItem'
import { Trans } from 'react-i18next'

interface ViewInputProps {
  item: ResultInputItem
}

export const ViewInput = (props: ViewInputProps): React.JSX.Element => {
  const data: InputItemData = clone(props.item.data)

  return <Box sx={{ py: 1 }}>
    <Box>
      <><Trans>Line #</Trans>{data.line}: {data.time} {data.text}  {data.total}</>
    </Box>
    <Box>
      <pre>
        {JSON.stringify(data.fields, null, 2)}
      </pre>
    </Box>
  </Box>
}
