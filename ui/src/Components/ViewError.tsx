import React, { } from 'react'
import { Box } from '@mui/material'

interface ViewErrorProps {
  error: string
}

/**
 * Display error in nicely formatted manner.
 * @param props
 * @returns
 */
export const ViewError = (props: ViewErrorProps): React.JSX.Element => {
  const { error } = props

  function fixFile(fileName: string): string {
    if (/^node:\w+/.test(fileName)) {
      return fileName
    }
    for (const subPath of ['@tasenor/common/src', 'backend/src', 'node_modules/@prisma/client/', 'node_modules/.pnpm']) {
      const i = fileName.indexOf(subPath)
      if (i >= 0) {
        return fileName.substring(i)
      }
    }

    throw new Error(`Cannot trim file path '${fileName}'.`)
  }

  function trim(idx: number, line: string) {
    if (idx === 0) {
      const re = /^(.*):\d+$/.exec(line)
      if (re) {
        return line.replace(re[1], fixFile(re[1]))
      }
    }

    const re = /^\s+.*\((.*):\d+:\d+\)$/.exec(line)
    if (re) {
      return line.replace(re[1], fixFile(re[1]))
    }
    return line
  }

  const lines = error.split('\n').map((line, idx) => trim(idx, line))
  return (
    <Box sx={{ color: 'error.main' }}>
      <pre>
        {lines.join('\n')}
      </pre>
    </Box>
  )
}
