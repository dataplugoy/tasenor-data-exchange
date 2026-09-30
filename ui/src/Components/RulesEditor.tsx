import React from 'react'
import { Box } from '@mui/material'
import { JsonEditor } from 'json-edit-react'
import { githubDarkTheme } from '@json-edit-react/themes'
import { EditableRule } from '../Types/EditableRule'

export interface RulesEditorProps {
  rules: EditableRule[]
  onUpdate: (rules: EditableRule[]) => void
}

export const RulesEditor = (props: RulesEditorProps): React.JSX.Element => {

  return <Box>
    {
      props.rules.length > 0 &&
      <JsonEditor
        data={ props.rules }
        setData={ (data) => { props.onUpdate(data as EditableRule[]) }}
        theme={ githubDarkTheme }
        minWidth="100%"
      />
    }
  </Box>
}
