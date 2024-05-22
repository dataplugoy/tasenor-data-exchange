import React from 'react'
import UnifiedItemData from '../schema/UnifiedItemData.json'
import UnifiedItemType from '../schema/UnifiedItemType.json'
import Asset from '../schema/Asset.json'
import Rates from '../schema/Rates.json'

const schema = {
  'UnifiedItemData.json': UnifiedItemData,
  'UnifiedItemType.json': UnifiedItemType,
  'Asset.json': Asset,
  'Rates.json': Rates,
}

interface TypeProps {
  file: string
  field: string
}

export default function Type(props: TypeProps) {
  const { file, field } = props

  /**
   * Analyze string pattern.
   * @param type
   * @param pattern
   */
  function string(type, pattern) {
    if (type instanceof Array && type.length === 2 && type.includes('string') && type.includes('number')) {
      if (pattern === '^[0-9]+(\\.[0-9]+)?$') {
        return 'non-negative number'
      }
    }
  }

  /**
   * Resolve textual description.
   * @param file
   * @param field
   * @returns
   */
  function resolve(file, field) {

    if (!schema[file]) return `FILE ${file} NOT FOUND`

    switch (schema[file].type) {

      case 'object':
        if (!schema[file].properties[field]) return `FIELD ${field} NOT FOUND`

        if (schema[file].properties[field].$ref) {
          if (schema[file].properties[field].$ref) {
            return resolve(schema[file].properties[field].$ref, '')
          }
        }
        const { type, pattern } = schema[file].properties[field]
        const text = string(type, pattern)
        if (text) return text
        if (pattern === undefined) return 'string'
        break

      case 'string':
        return schema[file].enum ? 'enum' : 'string'
    }
  }

  const text = resolve(file, field)
  if (text) return <span className="tx-type">({text})</span>

  return <>TODO: {file} '{field}' {schema[file].type}</>
}
