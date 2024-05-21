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
      <Box sx={{ border: '1px solid rgba(0,0,0,0.5)', flex: '0 0 auto', backgroundColor: 'rgb(255,255,255,0.05)', p: 2 }}>
        {children}
      </Box>
    </Box>
  )
}
