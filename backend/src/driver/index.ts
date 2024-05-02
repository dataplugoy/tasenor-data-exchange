import prisma from '@prisma/client'
import { Constructor } from '@tasenor/common'
import { TestMockDriver } from './TestMockDriver'
import { EnableBankingDriver } from './EnableBankingDriver'
import { Driver } from './Driver'
import { DriverSettings } from '../types/DriverSettings'
import { NoActionDriver } from './NoActionDriver'
import { ManualUploadDriver } from './ManualUploadDriver'
import { NordnetDriver } from './NordnetDriver'

/**
 * Drivers implemented.
 */
const drivers: Record<prisma.DriverType, Constructor<Driver>> = {
  TEST_MOCK: TestMockDriver,
  NO_ACTION: NoActionDriver,
  ENABLE_BANKING: EnableBankingDriver,
  MANUAL_UPLOAD: ManualUploadDriver,
  NORDNET: NordnetDriver,
}

/**
 * Helper to instantiate a driver for a type.
 */
export function getDriver(type: prisma.DriverType, settings: DriverSettings): Driver {
  const DriverConstructor = drivers[type]
  if (!DriverConstructor) {
    throw new Error(`Cannot find driver for input source type '${type}'.`)
  }
  return new DriverConstructor(settings)
}
