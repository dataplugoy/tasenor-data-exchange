import React from 'react'
import UnifiedItemType from '../schema/UnifiedItemType.json'

export default function TxTypes({}) {
  const ret: JSX.Element[] = []

  UnifiedItemType.enum.slice(0, UnifiedItemType.enum.length - 2).forEach(t => ret.push(<span key={t} className="tx-types">"{t}", </span>))
  ret.push(<span key="and"><span className="tx-types">"{UnifiedItemType.enum[UnifiedItemType.enum.length - 2]}"</span> and </span>)
  ret.push(<span key="last" className="tx-types">"{UnifiedItemType.enum[UnifiedItemType.enum.length - 1]}"</span>)
  return ret
}
