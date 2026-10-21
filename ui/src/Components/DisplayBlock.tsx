import React, { } from 'react'
import { Box } from '@mui/material'

interface DisplayBlockProps {
  children: React.ReactNode
}

/**
 * Display long lines with scrolling.
 * @param props
 * @returns
 */
export const DisplayBlock = (props: DisplayBlockProps): React.JSX.Element => {
  const { children } = props

  return (
    <Box sx={{ display: 'flex', flexWrap: 'nowrap', overflowX: 'auto', my: 2 }}>
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, flex: '0 0 auto', backgroundColor: '#FFFFFF', p: 2 }}>
        {children}
      </Box>
    </Box>
  )
}
