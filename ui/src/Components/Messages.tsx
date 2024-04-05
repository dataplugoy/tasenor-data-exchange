import React from 'react'
import { Alert, Box, Snackbar } from '@mui/material'
import { useApp } from '../Hooks/useApp'

/**
 * Display for UI messages.
 */
export const Messages = (): React.ReactNode => {

  const app = useApp()

  if (app.messages.length === 0) return <></>

  return (
    <Snackbar open>
      <Box>
        {app.messages.map((msg, idx) =>
          <Alert severity={msg.type} key={idx}>
            {msg.text}
          </Alert>
        )}
      </Box>
    </Snackbar>
  )
}
