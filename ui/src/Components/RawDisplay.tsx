import React, { } from 'react'
import { Box, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

interface RawDisplayProps {
  data: {
    data: string
    encoding: string
  }
}

/**
 * Render raw data.
 * @param props
 * @returns
 */
export const RawDisplay = (props: RawDisplayProps): React.JSX.Element => {
  const { data, encoding } = props.data

  const text = Buffer.from(data).toString(encoding as BufferEncoding)

  return (
    <Box>
      { text.split('\n').map((line, idx) => <Typography key={idx} variant="body2">{line}</Typography>) }
    </Box>
  )
}
