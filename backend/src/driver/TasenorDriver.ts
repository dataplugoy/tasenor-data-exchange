import { AccountModelData, AccountNumber, AdditionalTransferInfo, DocumentModelData, EntryModelData, ID, PeriodModelData, Token } from '@tasenor/common'
import { OutputItemModel } from '../models/OutputItemModel'
import { ProjectSettings } from '../types/API/Project'
import { TasenorDriverSettings } from '../types/DriverSettings'
import { TasenorFlowState } from '../types/FlowState'
import { Transaction, TransactionLine } from '../types/API/Transaction'
import { DateTime } from 'luxon'
import { dec } from '../lib/utils'
import { AccountCode } from '../types/AccountCode'
import { Setup } from '../types/API/Setup'
import { jwtDecode } from 'jwt-decode'
import { RemoteAccount } from '../types/API/RemoteAccount'
import { Account } from '../types/API/Account'
import { AccountException } from '../exceptions/AccountException'
import { RemoteId } from '../types/API/RemoteId'
import { OutputDriver } from './OutputDriver'

export class TasenorDriver extends OutputDriver {

  declare settings: TasenorDriverSettings
  declare state: TasenorFlowState

  private periods: PeriodModelData[]
  private accounts: Record<AccountNumber, AccountModelData>

  constructor(settings: TasenorDriverSettings, projectSettings: ProjectSettings, setup: Setup = {}) {
    super(settings, projectSettings, setup, 'TASENOR')
    this.periods = []
    this.accounts = {}
  }

  protected get baseUrl(): string {
    return this.settings.host
  }

  protected bearerToken(): string | null {
    return this.state && this.state.token ? this.state.token : null
  }

  async autheticate(): Promise<TasenorFlowState> {

    if (this.state.token) {
      const decoded = jwtDecode(this.state.token)
      if (decoded.exp) {
        const now = new Date().getTime()
        // Leave 5 second marging.
        if (now < decoded.exp * 1000 - 5000) {
          return this.state
        }
      }
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
    this.state = await this.autheticate()
    if (Object.keys(this.accounts).length === 0) {
      const accs: AccountModelData[] = await this.GET(`/db/${this.settings.database}/account`)
      this.accounts = {}
      accs.forEach(acc => {
        this.accounts[acc.number] = acc
      })
    }
  }

  async fetchRemoteAccounts(): Promise<RemoteAccount[]> {
    const hints = (acc: AccountModelData): Account[] => {
      const ret: Account[] = []
      if (acc.data.currency) {
        ret.push(`CURRENCY_${acc.data.currency}`)
      }
      if (acc.type === 'REVENUE') {
        ret.push('INCOME')
      }
      if (acc.type === 'EXPENSE') {
        ret.push('EXPENSE')
      }
      return ret
    }

    this.state = await this.autheticate()
    await this.loadAccounts()

    return Object.values(this.accounts).map(account => ({
      number: account.number,
      name: account.name,
      hints: hints(account)
    }))
  }

  /**
   * Resolve remote account for a code.
   * @param code
   */
  findAccount(code: AccountCode): AccountModelData {
    const map: Record<AccountCode, AccountNumber> = this.setup.accounts as Record<AccountCode, AccountNumber> || {}
    if (!map[code]) {
      throw new AccountException(code)
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
  resolveExtras(line: TransactionLine): AdditionalTransferInfo {
    const { extras } = line
    const ret: AdditionalTransferInfo = {}
    Object.keys(extras).forEach(key => {
      switch (key) {
        case 'asset':
          break

        case 'assetChange':
          ret.stock = {
            change: {
              [`${extras.asset}`]: {
                amount: dec(extras.assetChange).toNumber(),
                value: dec(line.amount).toNumber(),
              }
            }
          }
          break

        case 'tags':
          ret.text = extras[key]?.map(k => `[${k}]`).join('')
          break

        default:
          throw new Error(`TasenorDriver does not handle extra field '${key}' yet in ${JSON.stringify(extras)}.`)
      }
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
    const data = this.resolveExtras(line)

    let prefix = ''
    if (data.text) {
      prefix = `${data.text} `
      delete data.text
    }

    return {
      document_id: doc.id,
      account_id: this.findAccount(line.account as AccountCode).id,
      debit: amount >= 0 ? 1 : 0,
      amount: Math.abs(amount) * 100,
      description: `${prefix}${line.text}`,
      row_number: row,
      data
    }
  }

  /**
   * Push new document to the period matching the time stamp.
   * @param output
   */
  async deliverOutput(output: OutputItemModel): Promise<RemoteId> {
    await this.loadAccounts()

    // Dry run first to check that accounts are configured.
    const tx: Transaction = output.data.data as unknown as Transaction
    const period = await this.getPeriod(tx)
    const doc = this.getDoc(period, tx)
    for (const line of tx.lines) {
      this.getEntry(doc, line, 1)
    }

    // Do the actual saving.
    const document: DocumentModelData = await this.POST(`/db/${this.settings.database}/document`, doc)

    // Remote ID.
    const ret = {
      type: 'TASENOR',
      db: this.settings.database,
      period: period.id,
      doc: document.id,
      entries: [] as ID[]
    }

    try {
      let row = 1
      for (const line of tx.lines) {
        const entry = this.getEntry(document, line, row++)
        const out: EntryModelData = await this.POST(`/db/${this.settings.database}/entry`, entry)
        ret.entries.push(out.id as ID)
      }
    } catch (err) {
      // Roll back changes made.
      for (const id of ret.entries) {
        await this.DELETE(`/db/${this.settings.database}/entry/${id}`)
      }
      await this.DELETE(`/db/${this.settings.database}/document/${document.id}`)

      throw err
    }

    return ret as RemoteId
  }

  needConfiguredAccounts(): boolean {
    return true
  }
}
