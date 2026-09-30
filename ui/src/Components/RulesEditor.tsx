import React from 'react'
import { Box } from '@mui/material'
import { JsonEditor, githubDarkTheme } from 'json-edit-react'
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
        onUpdate={ ({ newData }) => { props.onUpdate(newData as EditableRule[]) }}
        theme={ githubDarkTheme }
        minWidth="100%"
      />
    }
  </Box>
}
