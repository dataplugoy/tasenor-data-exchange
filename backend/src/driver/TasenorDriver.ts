import { AccountModelData, AccountNumber, AdditionalTransferInfo, DocumentModelData, EntryModel, EntryModelData, ID, PeriodModelData, Token } from '@tasenor/common'
import { OutputItemModel } from '../models/OutputItemModel'
import { ProjectSettings } from '../types/API/Project'
import { TasenorDriverSettings } from '../types/DriverSettings'
import { TasenorFlowState } from '../types/FlowState'
import { RemoteId } from '../types/RemoteId'
import { InternetDriver } from './InternetDriver'
import { Transaction, TransactionExtras, TransactionLine } from '../types/API/Transaction'
import { DateTime } from 'luxon'
import { dec } from '../lib/utils'
import { AccountCode } from '../types/AccountCode'

export class TasenorDriver extends InternetDriver {

  declare settings: TasenorDriverSettings
  declare state: TasenorFlowState

  private periods: PeriodModelData[]
  private accounts: Record<AccountNumber, AccountModelData>

  constructor(settings: TasenorDriverSettings, projectSettings: ProjectSettings) {
    super(settings, projectSettings, 'TASENOR')
    this.periods = []
    this.accounts = {}
  }

  canHandleOutput(): boolean {
    return true
  }

  protected get baseUrl(): string {
    return this.settings.host
  }

  protected bearerToken(): string | null {
    return this.state && this.state.token ? this.state.token : null
  }

  async autheticate(): Promise<TasenorFlowState> {

    // TODO: Check if it is still valid.
    if (this.state.token) {
      return this.state
    }

    const res = await this.POST<{ token: Token }>('/auth', {
      user: this.settings.user,
      password: this.settings.password
    })
    if (res && res.token) {
      return { token: res.token }
    }

    throw new Error(`Login of ${this.settings.user} to ${this.settings.host} failed.`)
  }

  /**
   * Gather all periods from the remote database if not yet gathered.
   * @returns
   */
  async getPeriods(): Promise<PeriodModelData[]> {
    if (this.periods.length === 0) {
      this.periods = await this.GET(`/db/${this.settings.database}/period`)
    }
    return this.periods
  }

  /**
   * Load and store accounts.
   */
  async loadAccounts(): Promise<void> {
    if (Object.keys(this.accounts).length === 0) {
      const accs: AccountModelData[] = await this.GET(`/db/${this.settings.database}/account`)
      this.accounts = {}
      accs.forEach(acc => {
        this.accounts[acc.number] = acc
      })
    }
  }

  /**
   * Resolve remote account for a code.
   * @param code
   */
  findAccount(code: AccountCode): AccountModelData {
    // TODO: Get the mapping using account resolver and flow plan settings.
    const map = {
      CURRENCY_EUR: '3050',
      CURRENCY_USD: '30505'
    }
    if (!map[code]) {
      throw new Error(`Unable to resolve remote account for '${code}'.`)
    }
    const number = map[code]
    if (!this.accounts[number]) {
      throw new Error(`It seems that configured account '${number}' for '${code}' does not exist anymore.`)
    }
    return this.accounts[number]
  }

  /**
   * Sort out the extras and transform them for Tasenor.
   * @param extras
   * @returns
   */
  resolveExtras(extras: TransactionExtras): AdditionalTransferInfo {
    const ret: AdditionalTransferInfo = {}
    Object.keys(extras).forEach(key => {
      throw new Error(`TasenorDriver does not handle extra field '${key}' yet.s`)
    })
    return ret
  }

  /**
   * Find the period for a transaction or throw error if cannot.
   * @param tx
   * @returns
   */
  async getPeriod(tx: Transaction): Promise<PeriodModelData> {
    const periods = await this.getPeriods()

    // TODO: Suboptimal. We could map by year and check the one with matching year first.
    for (const period of periods) {
      const start = DateTime.fromISO(period.start_date + 'T00:00:00Z').toUTC()
      const end = DateTime.fromISO(period.end_date + 'T23:59:59.999Z').toUTC()
      const time = DateTime.fromISO(tx.time)
      if (time >= start && time <= end) {
        return period
      }
    }

    throw new Error(`Unable to find matching accounting period from db '${this.settings.database}' for transaction time ${tx.time}.`)
  }

  /**
   * Convert output to Tasenor document.
   * @param tx
   */
  getDoc(period: PeriodModelData, tx: Transaction): DocumentModelData {
    return {
      number: undefined, // Let the remote decide.
      period_id: period.id as ID,
      date: tx.time,
    }
  }

  /**
   * Convert output line to Tasenor entry.
   * @param doc
   * @param line
   */
  getEntry(doc: DocumentModelData, line: TransactionLine, row: number): EntryModelData {
    const amount = dec(line.amount).toNumber()

    return {
      document_id: doc.id,
      account_id: this.findAccount(line.account as AccountCode).id,
      debit: amount >= 0 ? 1 : 0,
      amount: Math.abs(amount),
      description: line.text,
      row_number: row,
      data: this.resolveExtras(line.extras)
    }
  }

  /**
   * Push new document to the period matching the time stamp.
   * @param output
   */
  async deliverOutput(output: OutputItemModel): Promise<RemoteId> {
    await this.loadAccounts()
    // TODO: Throw in any step if it fails.
    const tx: Transaction = output.data.data as unknown as Transaction
    const period = await this.getPeriod(tx)
    const doc: DocumentModelData = await this.POST(`/db/${this.settings.database}/document`, this.getDoc(period, tx))
    let row = 1

    // Remote ID.
    const ret = {
      db: this.settings.database,
      period: period.id,
      doc: doc.id,
      entries: [] as ID[]
    }

    for (const line of tx.lines) {
      const out: EntryModelData = await this.POST(`/db/${this.settings.database}/entry`, this.getEntry(doc, line, row++))
      ret.entries.push(out.id as ID)
    }

    // throw new Error(`NOT DONE YET.`)
    return ret as unknown as RemoteId
  }
}
