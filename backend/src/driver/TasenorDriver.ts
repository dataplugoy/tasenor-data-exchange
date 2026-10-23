import { AccountModelData, AccountNumber, AdditionalTransferInfo, Asset, DocumentModelData, EntryModelData, ID, Language, PeriodModelData, StockBookkeeping, StockChangeData, Token } from '@tasenor/common'
import { OutputItemModel } from '../models/OutputItemModel'
import { ProjectSettings } from '../types/API/Project'
import { TasenorDriverSettings } from '../types/DriverSettings'
import { TasenorFlowState } from '../types/FlowState'
import { Transaction, TransactionLine } from '../types/API/Transaction'
import { DateTime } from 'luxon'
import { cents, dec } from '../lib/utils'
import { AccountCode } from '../types/AccountCode'
import { Setup } from '../types/API/Setup'
import { jwtDecode } from 'jwt-decode'
import { RemoteAccount } from '../types/API/RemoteAccount'
import { Account } from '../types/API/Account'
import { RemoteId } from '../types/API/RemoteId'
import { OutputDriver } from './OutputDriver'
import { OpeningState } from '../types/API/OpeningState'
import { addOpeningAsset, cleanOpeningState, emptyOpeningState } from '../lib/opening'
import { t } from '../lib/i18n/t'
import { HTTPException } from '../exceptions/HTTPException'

/**
 * A document of a period with its entries.
 */
type DocumentWithEntries = DocumentModelData & {
  entries: (EntryModelData & { data: StockChangeData | string | null })[]
}

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

  canProvideOpeningState(): boolean {
    return true
  }

  /**
   * Sum up the entries of the configured accounts in the period of the date: the initial balances (document 0) and
   * the documents dated before it. The stock data of the entries gives the assets.
   */
  async openingState(date: string): Promise<OpeningState | null> {
    const language = this.projectSettings.language as Language
    const state = emptyOpeningState(date, this.type)

    // Configured accounts by their numbers.
    const codes: Record<AccountNumber, AccountCode[]> = {}
    const add = (code: string, number: unknown) => {
      if (number) {
        codes[number as AccountNumber] = [...(codes[number as AccountNumber] || []), code as AccountCode]
      }
    }
    Object.entries(this.setup.accounts || {}).forEach(([code, number]) => add(code, number))
    Object.entries((this.setup.settings?.debtAccounts || {}) as Record<string, unknown>).forEach(([currency, number]) => add(`DEBT_CURRENCY_${currency}`, number))

    await this.loadAccounts()
    const period = (await this.getPeriods()).find(period => `${period.start_date}` <= date && date <= `${period.end_date}`)
    if (!period) {
      state.notes.push(t(language, 'There is no period for {{date}} in the bookkeeping.', { date }))
      return state
    }
    const documents: DocumentWithEntries[] = await this.GET(`/db/${this.settings.database}/document?period=${period.id}&entries`)
    const used = documents
      .filter(doc => doc.number === 0 || `${doc.date}` < date)
      .sort((a, b) => `${a.date}`.localeCompare(`${b.date}`) || (a.number || 0) - (b.number || 0))

    const numbers: Record<number, AccountNumber> = {}
    Object.values(this.accounts).forEach(account => (numbers[account.id as number] = account.number))
    const cents: Record<AccountNumber, number> = {}
    const stock: Record<AccountNumber, StockBookkeeping> = {}
    for (const doc of used) {
      for (const entry of doc.entries) {
        const number = numbers[entry.account_id as number]
        if (!codes[number]) {
          continue
        }
        cents[number] = (cents[number] || 0) + (entry.debit ? entry.amount : -entry.amount)
        const data = typeof entry.data === 'string' ? JSON.parse(entry.data) : entry.data
        if (data && data.stock) {
          stock[number] = stock[number] || new StockBookkeeping(`Account ${number}`)
          stock[number].apply(new Date(`${doc.date}T00:00:00Z`), data)
        }
      }
    }

    for (const [number, accountCodes] of Object.entries(codes)) {
      if (accountCodes.length > 1) {
        state.notes.push(t(language, 'The accounts {{codes}} are all booked to {{number}}, so their balances cannot be told apart.', { codes: accountCodes.join(', '), number }))
        continue
      }
      const code = accountCodes[0]
      if (cents[number]) {
        state.balance[code] = cents[number] / 100
      }
      if (stock[number]) {
        for (const [asset, record] of Object.entries(stock[number].summary(1e-12, false, false) as Record<Asset, { amount: number, value: number }>)) {
          addOpeningAsset(state, code, asset as Asset, dec(record.amount), dec(record.value).div(100))
        }
      }
    }

    cleanOpeningState(state)
    return state
  }

  /**
   * Resolve remote account for a code.
   * @param code
   */
  findAccount(code: AccountCode): AccountModelData {
    const number = this.configuredAccount(code)
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
                value: cents(line.amount).mul(100).toNumber(),
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
    const amount = cents(line.amount)
    const data = this.resolveExtras(line)

    let prefix = ''
    if (data.text) {
      prefix = `${data.text} `
      delete data.text
    }

    return {
      document_id: doc.id,
      account_id: this.findAccount(line.account as AccountCode).id,
      debit: amount.gte(0) ? 1 : 0,
      amount: amount.abs().mul(100).toNumber(),
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
    let total = 0
    for (const line of tx.lines) {
      const entry = this.getEntry(doc, line, 1)
      total += entry.debit ? entry.amount : -entry.amount
    }
    if (total !== 0) {
      throw new Error(`Entries of the transaction do not balance but leave ${total} cents: ${JSON.stringify(tx)}`)
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

  canRollback(): boolean {
    return true
  }

  async rollbackOuput(output: OutputItemModel): Promise<void> {
    this.state = await this.autheticate()
    const { db, doc, entries } = output.data.remoteId as {
      db: string
      doc: number
      period: number
      entries: number[]
    }

    // A retry of a rollback failed midway finds some of them removed already.
    const remove = async (url: string) => {
      try {
        await this.DELETE(url)
      } catch (err) {
        if (!(err instanceof HTTPException && err.status === 404)) {
          throw err
        }
      }
    }
    for (const id of entries) {
      await remove(`/db/${db}/entry/${id}`)
    }
    await remove(`/db/${db}/document/${doc}`)
  }
}
