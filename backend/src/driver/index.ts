import prisma from '@prisma/client'
import { Constructor } from '@tasenor/common'
import { TestMockDriver } from './TestMockDriver'
import { EnableBankingDriver } from './EnableBankingDriver'
import { Driver } from './Driver'
import { DriverSettings } from '../types/DriverSettings'

/**
 * Drivers implemented.
 */
const drivers: Record<prisma.DriverType, Constructor<Driver>> = {
  TEST_MOCK: TestMockDriver,
  ENABLE_BANKING: EnableBankingDriver,
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
