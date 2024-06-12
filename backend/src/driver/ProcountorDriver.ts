import { AccountModelData, AccountNumber, PeriodModelData } from '@tasenor/common'
import { ProjectSettings } from '../types/API/Project'
import { ProcountorDriverSettings } from '../types/DriverSettings'
import { Setup } from '../types/API/Setup'
import { OutputDriver } from './OutputDriver'
import { ProcountorFlowState } from '../types/FlowState'

export class TasenorDriver extends OutputDriver {

  declare settings: ProcountorDriverSettings
  declare state: ProcountorFlowState

  private periods: PeriodModelData[]
  private accounts: Record<AccountNumber, AccountModelData>

  constructor(settings: ProcountorDriverSettings, projectSettings: ProjectSettings, setup: Setup = {}) {
    super(settings, projectSettings, setup, 'PROCOUNTOR')
    this.periods = []
    this.accounts = {}
  }

  needConfiguredAccounts(): boolean {
    return true
  }
}
