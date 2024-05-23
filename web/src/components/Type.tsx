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

let referencesResolved = false

export default function Type(props: TypeProps) {
  const { file, field } = props

  /**
   * Assign $ref fields.
   */
  function resolveReferences() {
    for (const json of Object.keys(schema)) {
      if (schema[json].type === 'object') {
        if (schema[json].properties) {
          for (const field of Object.keys(schema[json].properties)) {
            const ref = schema[json].properties[field].$ref
            if (ref) {
              Object.assign(schema[json].properties[field], schema[ref])
            }
          }
        }
      }
    }
  }

  if (!referencesResolved) {
    resolveReferences()
    referencesResolved = true
    // console.log(schema['UnifiedItemData.json']);
  }

  /**
   * Analyze string pattern.
   * @param type
   */
  function resolveString(spec) {
    if (spec.enum) {
      return 'enum'
    }
    if (spec.pattern === undefined) {
      return 'string'
    }
    if (spec.title === 'Asset') {
      return 'asset'
    }
    if (spec.pattern === '^(STOCK|CRYPTO)$') {
      return 'asset type'
    }
    // TODO: Make this more flexible and dig explicit list to the docs.
    if (spec.pattern === '^(DIVIDEND)$') {
      return 'enum'
    }
  }

  function resolveNumeric(spec) {
    if (spec.pattern === '^[0-9]+(\\.[0-9]+)?$') {
      return 'non-negative number'
    }
  }

  function resolveNumber(spec) {
    return 'number'
  }

  /**
   * Resolve textual description.
   * @param file
   * @param field
   * @returns
   */
  function resolve(spec, field) {

    switch (spec.type) {

      case 'object':
        if (!spec.properties[field]) return `FIELD ${field} NOT FOUND`
        if (spec.properties[field].properties && Object.keys(spec.properties[field].properties).length === 0) {
          return 'map'
        }
        return resolve(spec.properties[field], '')

      case 'string':
        return resolveString(spec)

      case 'number':
        return resolveNumber(spec)

      default:
        if (spec.type instanceof Array
          && spec.type.length === 2
          && spec.type.includes('string')
          && spec.type.includes('number')) {
            return resolveNumeric(spec)
          }
    }
  }

  if (!schema[file]) return `FILE ${file} NOT FOUND`

  const text = resolve(schema[file], field)
  if (text) return <span className="tx-type">({text})</span>

  return <>TODO: {file} '{field}' {schema[file].type}</>
}
