import React from 'react'
import { Box } from '@mui/material'
import { Notes as ApiNotes } from '../Types/API/Notes'

interface NotesProps {
  notes?: ApiNotes
}

/**
 * Display notes for a run.
 */
export const Notes = (props: NotesProps): React.JSX.Element => {
  const { notes } = props

  if (!notes || Object.keys(notes).length === 0) {
    return <></>
  }

  return (
    <Box>
      {JSON.stringify(notes)}
    </Box>
  )
}
