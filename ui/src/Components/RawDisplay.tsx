import React, { } from 'react'
import { Box, Typography } from '@mui/material'
import { toBuffer } from '../Helpers/buffer'

interface RawDisplayProps {
  data: unknown
}

/**
 * Render raw data.
 * @param props
 * @returns
 */
export const RawDisplay = (props: RawDisplayProps): React.JSX.Element => {
  const text = toBuffer(props.data).toString('utf-8')

  return (
    <Box>
      { text.split('\n').map((line, idx) => <Typography key={idx} variant="body2">{line}</Typography>) }
    </Box>
  )
}
