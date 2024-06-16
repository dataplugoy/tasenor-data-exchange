import React from 'react'
import { getSchema } from './utils'

interface TypeProps {
  file: string
  field: string
}

export default function EnumValues(props: TypeProps) {
  const schema = getSchema(props.file, props.field)
  if (schema.type === 'string' && schema.pattern) {
    const re = /^\^\(([A-Z_|]+)\)\$$/.exec(schema.pattern)
    if (re) {
      return <span className="enum-values">{re[1].split('|').join(', ')}</span>
    }
  }
  return <span className="enum-values"></span>
}
