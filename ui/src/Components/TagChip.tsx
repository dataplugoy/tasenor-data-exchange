import React from 'react'
import { LabelTwoTone } from '@mui/icons-material'
import { Chip } from '@mui/material'

interface TagChipProps {
  tag: string
  title?: string
}

export const TagChip = (props: TagChipProps): React.JSX.Element => {
  const { tag, title } = props
  return <Chip
    sx={{ ml: 1, px: 1 }}
    title={title}
    icon={<LabelTwoTone/>}
    label={tag}
    size="medium"
    style={{
      color: 'white',
      backgroundColor: 'transparent',
      border: '1px solid rgba(255,255,255,0.5)',
    }}
  />
}
