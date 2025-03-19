import React, { } from 'react'
import { Box, Typography } from '@mui/material'

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

  type BufferEncoding = 'ascii' | 'utf8' | 'utf-8' | 'utf16le' | 'utf-16le' | 'ucs2' | 'ucs-2' | 'base64' | 'base64url' | 'latin1' | 'binary' | 'hex'

  const text = Buffer.from(data).toString(encoding as BufferEncoding)

  return (
    <Box>
      { text.split('\n').map((line, idx) => <Typography key={idx} variant="body2">{line}</Typography>) }
    </Box>
  )
}
