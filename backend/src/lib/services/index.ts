import prisma from '@prisma/client'
import { Constructor } from '@tasenor/common'
import { Service } from './Service'
import { ServiceSettings } from '../../types/ServiceSettings'
import { TasenorService } from './TasenorService'
import { JsonFileService } from './JsonFileService'
import { OpenFigiService } from './OpenFigiService'
import { CoinbasePricesService } from './CoinbasePricesService'
import { EcbRatesService } from './EcbRatesService'

const services: Record<prisma.ServiceDriver, Constructor<Service>> = {
  JSON_FILE: JsonFileService,
  TASENOR: TasenorService,
  OPEN_FIGI: OpenFigiService,
  COINBASE_PRICES: CoinbasePricesService,
  ECB_RATES: EcbRatesService,
}

export function getService(driver: prisma.ServiceDriver, settings: ServiceSettings): Service {
  const DriverConstructor = services[driver]
  if (!DriverConstructor) {
    throw new Error(`Cannot find service driver for '${driver}'.`)
  }
  return new DriverConstructor(settings)
}
