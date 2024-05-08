import prisma from '@prisma/client'
import { Constructor } from '@tasenor/common'
import { TestMockDriver } from './TestMockDriver'
import { EnableBankingDriver } from './EnableBankingDriver'
import { Driver } from './Driver'
import { DriverSettings } from '../types/DriverSettings'
import { NoActionDriver } from './NoActionDriver'
import { ManualUploadDriver } from './ManualUploadDriver'
import { NordnetDriver } from './NordnetDriver'
import { ProjectSettings } from '../types/API/Project'
import { TasenorDriver } from './TasenorDriver'
import { Setup } from '../types/API/Setup'

/**
 * Drivers implemented.
 */
const drivers: Record<prisma.DriverType, Constructor<Driver>> = {
  TEST_MOCK: TestMockDriver,
  NO_ACTION: NoActionDriver,
  ENABLE_BANKING: EnableBankingDriver,
  MANUAL_UPLOAD: ManualUploadDriver,
  NORDNET: NordnetDriver,
  TASENOR: TasenorDriver,
}

/**
 * Helper to instantiate a driver for a type.
 */
export function getDriver(type: prisma.DriverType, settings: DriverSettings, projectSettings: ProjectSettings, setup: Setup = {}): Driver {
  const DriverConstructor = drivers[type]
  if (!DriverConstructor) {
    throw new Error(`Cannot find driver for driver type '${type}'.`)
  }
  return new DriverConstructor(settings, projectSettings, setup)
}
