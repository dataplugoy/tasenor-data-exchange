import React from 'react'
import UnifiedItemData from '../schema/UnifiedItemData.json'
import UnifiedItemType from '../schema/UnifiedItemType.json'

const schema = {
  'UnifiedItemData.json': UnifiedItemData,
  'UnifiedItemType.json': UnifiedItemType,
}

interface TypeProps {
  file: string
  field: string
}

export default function Type(props: TypeProps) {
  const { file, field } = props

  function resolve(file, field) {

    if (!schema[file]) return 'FILE NOT FOUND'

    switch (schema[file].type) {

      case 'object':
        if (!schema[file].properties[field]) return 'FIELD NOT FOUND'

        if (schema[file].properties[field].$ref) {
          if (schema[file].properties[field].$ref) {
            return resolve(schema[file].properties[field].$ref, '')
          }
        }
        break

      case 'string':
        return schema[file].enum ? 'enum' : 'string'
    }
  }

  const text = resolve(file, field)
  if (text) return <span>{text}</span>

  return <>TODO: {file} '{field}' {schema[file].type}</>
}
