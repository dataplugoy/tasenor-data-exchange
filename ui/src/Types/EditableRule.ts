import { UnifiedItemRule } from './API/UnifiedItemRule'

export interface EditableRule {
  filter: string
  name: string
  key: string | null
  result: UnifiedItemRule
  kind?: 'MAPPING' | 'ADVANCED'
  enabled?: boolean
  notes?: string
  filterView?: Record<string, unknown>
  resultView?: Record<string, unknown>
}
