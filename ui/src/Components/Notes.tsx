import React from 'react'
import { Box } from '@mui/material'
import { Notes as ApiNotes } from '../Types/API/Notes'
import { Trans } from 'react-i18next'

type valueof<T> = T[keyof T]

interface NoteProps {
  name: keyof ApiNotes
  notes: valueof<ApiNotes>
}

export const Note = (props: NoteProps): React.JSX.Element => {
  const { name, notes } = props

  switch (name) {
    case 'configured':
      return <Box sx={{ mb: 2 }}>
        <Trans>Provided values for the following settings:</Trans><br/>
        <Box component="pre" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
          {Object.keys(notes as Object).map(s => `— ${s} = ${JSON.stringify((notes as object)[s])}`).join('\n')}
        </Box>
      </Box>

    case 'needSettings':
      return <>
        <Trans>Need to provide values for the following settings:</Trans><br/>
        {(notes as string[]).map(s => `— ${s}`).join('\n')}
      </>

    case 'needUpload':
      return <>
        <Trans>Need to select a file and upload</Trans>
      </>

    case 'uploaded':
      return <Box sx={{ mb: 2 }}>
        {notes as string}
      </Box>

    default:
      return <>{JSON.stringify({ [name]: notes })}</>
  }
}

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
      {Object.keys(notes).map(note => <Note key={note} name={note as keyof ApiNotes} notes={notes[note]}/>)}
    </Box>
  )
}
