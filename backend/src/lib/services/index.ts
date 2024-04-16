import prisma from '@prisma/client'
import { Constructor } from '@tasenor/common'
import { Service } from './Service'
import { ServiceSettings } from '../../types/ServiceSettings'
import { TasenorService } from './TasenorService'
import { JsonFileService } from './JsonFileService'

const services: Record<prisma.ServiceDriver, Constructor<Service>> = {
  JSON_FILE: JsonFileService,
  TASENOR: TasenorService
}

export function getService(type: prisma.ServiceDriver, settings: ServiceSettings): Service {
  const DriverConstructor = services[type]
  if (!DriverConstructor) {
    throw new Error(`Cannot find service driver for '${type}'.`)
  }
  return new DriverConstructor(settings)
}
