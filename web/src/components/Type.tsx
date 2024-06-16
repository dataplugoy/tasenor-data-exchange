import { getType } from './utils'

interface TypeProps {
  file: string
  field: string
}

export default function Type(props: TypeProps) {
  const { file, field } = props

  return getType(file, field)
}
