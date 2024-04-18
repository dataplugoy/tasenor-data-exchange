import { DirectoryPath } from '@tasenor/common'

export type RuntimeOptions = {
  tracking?: DirectoryPath | null
  auth?: string | null
  repeat: 'MAX' | number
}
