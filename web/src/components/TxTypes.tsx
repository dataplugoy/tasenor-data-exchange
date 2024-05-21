import React from 'react'
import UnifiedItemType from '../schema/UnifiedItemType.json'

export default function TxTypes({}) {
  const ret: JSX.Element[] = []

  UnifiedItemType.enum.slice(0, UnifiedItemType.enum.length - 2).forEach(t => ret.push(<span key={t} className="tx-type">"{t}", </span>))
  ret.push(<><span className="tx-type">"{UnifiedItemType.enum[UnifiedItemType.enum.length - 2]}"</span> and </>)
  ret.push(<span className="tx-type">"{UnifiedItemType.enum[UnifiedItemType.enum.length - 1]}"</span>)
  return ret
}
