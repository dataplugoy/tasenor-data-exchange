import { UnifiedItemData } from './API/UnifiedItem'

export interface EditableRule {
  filter: string
  name: string
  key: string | null
  result: UnifiedItemData
}
