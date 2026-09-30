import { ServiceType } from '@prisma/client'
import { Token } from '@tasenor/common'

export type ServiceSettings = {
  url: string
  key?: String
  token?: Token
  user?: string
  password?: string
  // Capabilities in use, if not all the driver provides.
  capabilities?: ServiceType[]
}
