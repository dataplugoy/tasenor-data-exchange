import { DateTime } from 'luxon'
import { BatchModel } from '../models/BatchModel'
import { InputItemData } from '../types/API/InputItem'
import { NordnetDriverSettings } from '../types/DriverSettings'
import { NordnetFlowState } from '../types/FlowState'
import { ManualUploadDriver } from './ManualUploadDriver'
import { FlowPlanModel } from '../models/FlowPlanModel'
import { RunModel } from '../models/RunModel'
import { InputItemModel } from '../models/InputItemModel'
import { RuleModel } from '../models/RuleModel'
import { UnifiedItem } from '../types/API/UnifiedItem'
import { ProjectSettings } from '../types/API/Project'
import { Setup } from '../types/API/Setup'
import { OpeningState } from '../types/API/OpeningState'
import { RateFunction, addOpeningAsset, addOpeningBalance, cleanOpeningState, emptyOpeningState, stockAccount } from '../lib/opening'
import { nordnetOpening } from '../lib/nordnet'
import { AccountCode } from '../types/AccountCode'
import { Language } from '@tasenor/common'
import { dec } from '../lib/utils'
import { t } from '../lib/i18n/t'

/**
 * A driver to upload Nordnet data.
 */
export class NordnetDriver extends ManualUploadDriver {

  declare settings: NordnetDriverSettings
  declare state: NordnetFlowState

  constructor(settings: NordnetDriverSettings, projectSettings: ProjectSettings, setup: Setup = {}) {
    super(settings, projectSettings, setup, 'NORDNET')
  }

  async itemizeInput(batch: BatchModel): Promise<InputItemData[]> {

    // Note: version 1 is newer than version 2.
    const version = await batch.detectVersion([
      /^\s*Id\s+Kirjauspäivä\s+Kauppapäivä\s+Maksupäivä\s+Salkku\s+Tapahtumatyyppi\s+Arvopaperi\s+ISIN\s+Määrä\s+Kurssi\s+Korko\s+Kokonaiskulut\s+Valuutta\s+Summa\s+Valuutta\s+Hankinta-arvo\s+Valuutta\s+Tulos\s+Valuutta\s+Kokonaismäärä\s+Saldo\s+Vaihtokurssi\s+Tapahtumateksti\s+Mitätöintipäivä\s+Laskelma\s+Vahvistusnumero\s+Välityspalkkio\s+Valuutta\s+Viitevaluuttakurssi\s*$/,
      /^\s*Id\s+Kirjauspäivä\s+Kauppapäivä\s+Maksupäivä\s+Salkku\s+Tapahtumatyyppi\s+Arvopaperi\s+Instrumenttityyppi\s+ISIN\s+Määrä\s+Kurssi\s+Korko\s+Kokonaiskulut\s+Valuutta\s+Summa\s+Valuutta\s+Hankinta-arvo\s+Valuutta\s+Tulos\s+Valuutta\s+Kokonaismäärä\s+Saldo\s+Vaihtokurssi\s+Tapahtumateksti\s+Mitätöintipäivä\s+Laskelma\s+Vahvistusnumero\s+Välityspalkkio\s+Valuutta\s*$/,
      /^\s*Id\s+Kirjauspäivä\s+Kauppapäivä\s+Maksupäivä\s+Salkku\s+Tapahtumatyyppi\s+Arvopaperi\s+ISIN\s+Määrä\s+Kurssi\s+Korko\s+Kokonaiskulut\s+Valuutta\s+Summa\s+Valuutta\s+Hankinta-arvo\s+Valuutta\s+Tulos\s+Valuutta\s+Kokonaismäärä\s+Saldo\s+Vaihtokurssi\s+Tapahtumateksti\s+Mitätöintipäivä\s+Laskelma\s+Vahvistusnumero\s+Välityspalkkio\s+Valuutta\s+Viitevaluuttakurssi\s+Alkuperäinen korko\s*$/,
      // Older variant of version 2 (used until 2021) without currencies for acquisition value and result.
      /^\s*Id\s+Kirjauspäivä\s+Kauppapäivä\s+Maksupäivä\s+Salkku\s+Tapahtumatyyppi\s+Arvopaperi\s+Instrumenttityyppi\s+ISIN\s+Määrä\s+Kurssi\s+Korko\s+Kokonaiskulut\s+Kokonaiskulut Valuutta\s+Summa\s+Valuutta\s+Hankinta-arvo\s+Tulos\s+Kokonaismäärä\s+Saldo\s+Vaihtokurssi\s+Tapahtumateksti\s+Mitätöintipäivä\s+Laskelma\s+Vahvistusnumero\s+Välityspalkkio\s+Välityspalkkio Valuutta\s*$/,
    ])

    if (version === null) {
      throw new Error('Unable to determine file format version. Maybe this is not a Nordnet statement?')
    }

    this.version = version
    if (version === 3) {
      return await this.itemizeInputVersion3(batch)
    }
    if (version === 4) {
      // Same content as version 2 and handled by the same rules.
      this.version = 2
      return await this.itemizeInputVersion2(batch, ['Hankinta-arvo Valuutta', 'Tulos Valuutta'])
    }
    return version === 2 ? await this.itemizeInputVersion2(batch) : await this.itemizeInputVersion1(batch)
  }

  async itemizeInputVersion1(batch: BatchModel): Promise<InputItemData[]> {

    const csv = await batch.parseCsvColumns({
      delimiter: '\t',
      raw: true,
      from: 2,
      columns: [
        'Id',
        'Kirjauspäivä',
        'Kauppapäivä',
        'Maksupäivä',
        'Salkku',
        'Tapahtumatyyppi',
        'Arvopaperi',
        'ISIN',
        'Määrä',
        'Kurssi',
        'Korko',
        'Kokonaiskulut',
        'Kokonaiskulut Valuutta',
        'Summa',
        'Valuutta',
        'Hankinta-arvo',
        'Hankinta-arvo Valuutta',
        'Tulos',
        'Tulos Valuutta',
        'Kokonaismäärä',
        'Saldo',
        'Vaihtokurssi',
        'Tapahtumateksti',
        'Mitätöintipäivä',
        'Laskelma',
        'Vahvistusnumero',
        'Välityspalkkio',
        'Välityspalkkio Valuutta',
        'Viitevaluuttakurssi',
      ]
    })

    this.preProcess(csv, {
      numericFields: ['Summa', 'Saldo'],
      numericOrNullFields: ['Välityspalkkio', 'Määrä', 'Kurssi', 'Kokonaiskulut', 'Kokonaismäärä', 'Hankinta-arvo', 'Vaihtokurssi', 'Viitevaluuttakurssi'],
      requiredFields: ['Tapahtumatyyppi', 'Summa', 'Kirjauspäivä'],
      defaults: {
        Valuutta: this.projectSettings.currency,
        Vaihtokurssi: 1
      }
    })

    return csv.map((line, index) => ({
      line: index + 2,
      original: line.raw,
      version: this.version,
      time: DateTime.fromISO(`${line.record['Kirjauspäivä']}T12:00:00Z`).toUTC().toISO() as string,
      text: line.record.Tapahtumateksti || line.record.Tapahtumatyyppi,
      total: line.record.Summa,
      fields: line.record
    }))
  }

  async itemizeInputVersion2(batch: BatchModel, missingColumns: string[] = []): Promise<InputItemData[]> {

    const csv = await batch.parseCsvColumns({
      delimiter: '\t',
      raw: true,
      from: 2,
      columns: [
        'Id',
        'Kirjauspäivä',
        'Kauppapäivä',
        'Maksupäivä',
        'Salkku',
        'Tapahtumatyyppi',
        'Arvopaperi',
        'Instrumenttityyppi',
        'ISIN',
        'Määrä',
        'Kurssi',
        'Korko',
        'Kokonaiskulut',
        'Kokonaiskulut Valuutta',
        'Summa',
        'Valuutta',
        'Hankinta-arvo',
        'Hankinta-arvo Valuutta',
        'Tulos',
        'Tulos Valuutta',
        'Kokonaismäärä',
        'Saldo',
        'Vaihtokurssi',
        'Tapahtumateksti',
        'Mitätöintipäivä',
        'Laskelma',
        'Vahvistusnumero',
        'Välityspalkkio',
        'Välityspalkkio Valuutta',
      ].filter(column => !missingColumns.includes(column))
    })

    this.preProcess(csv, {
      numericFields: ['Summa', 'Kurssi', 'Määrä', 'Kokonaiskulut', 'Kokonaismäärä', 'Hankinta-arvo', 'Saldo', 'Vaihtokurssi'],
      numericOrNullFields: ['Välityspalkkio'],
      requiredFields: ['Tapahtumatyyppi', 'Summa', 'Kirjauspäivä'],
    })

    return csv.map((line, index) => ({
      line: index + 2,
      original: line.raw,
      version: this.version,
      time: DateTime.fromISO(`${line.record['Kirjauspäivä']}T12:00:00Z`).toUTC().toISO() as string,
      text: line.record.Tapahtumateksti || line.record.Tapahtumatyyppi,
      total: line.record.Summa,
      fields: line.record
    }))
  }

  async itemizeInputVersion3(batch: BatchModel): Promise<InputItemData[]> {

    const csv = await batch.parseCsvColumns({
      delimiter: '\t',
      raw: true,
      from: 2,
      columns: [
        'Id',
        'Kirjauspäivä',
        'Kauppapäivä',
        'Maksupäivä',
        'Salkku',
        'Tapahtumatyyppi',
        'Arvopaperi',
        'ISIN',
        'Määrä',
        'Kurssi',
        'Korko',
        'Kokonaiskulut',
        'Kokonaiskulut Valuutta',
        'Summa',
        'Valuutta',
        'Hankinta-arvo',
        'Hankinta-arvo Valuutta',
        'Tulos',
        'Tulos Valuutta',
        'Kokonaismäärä',
        'Saldo',
        'Vaihtokurssi',
        'Tapahtumateksti',
        'Mitätöintipäivä',
        'Laskelma',
        'Vahvistusnumero',
        'Välityspalkkio',
        'Välityspalkkio Valuutta',
        'Viitevaluuttakurssi',
        'Alkuperäinen korko'
      ]
    })

    this.preProcess(csv, {
      numericFields: ['Summa', 'Saldo'],
      numericOrNullFields: ['Välityspalkkio', 'Määrä', 'Kurssi', 'Kokonaiskulut', 'Kokonaismäärä', 'Hankinta-arvo', 'Vaihtokurssi', 'Viitevaluuttakurssi'],
      requiredFields: ['Tapahtumatyyppi', 'Summa', 'Kirjauspäivä'],
      defaults: {
        Valuutta: this.projectSettings.currency,
        Vaihtokurssi: 1
      }
    })

    return csv.map((line, index) => ({
      line: index + 2,
      original: line.raw,
      version: this.version,
      time: DateTime.fromISO(`${line.record['Kirjauspäivä']}T12:00:00Z`).toUTC().toISO() as string,
      text: line.record.Tapahtumateksti || line.record.Tapahtumatyyppi,
      total: line.record.Summa,
      fields: line.record
    }))
  }

  canProvideOpeningState(): boolean {
    return true
  }

  async openingState(batch: BatchModel, firstDate: string, rate: RateFunction): Promise<OpeningState | null> {
    const items = await this.itemizeInput(batch)
    const opening = nordnetOpening(items.map(item => item.fields), firstDate, this.projectSettings.currency)
    if (!opening) {
      return null
    }
    const language = this.projectSettings.language as Language
    const state = emptyOpeningState(opening.date, this.type)

    for (const cash of opening.cash) {
      const value = await this.openingValue(state, cash.amount, cash.currency, rate, cash.currency)
      if (value !== null) {
        addOpeningBalance(state, `CURRENCY_${cash.currency}` as AccountCode, value)
      }
    }
    for (const position of opening.positions) {
      const [account, asset] = stockAccount(this.setup, 'STOCK', position.security as string)
      const value = await this.openingValue(state, position.cost || 0, position.currency, rate, asset)
      if (value !== null) {
        addOpeningAsset(state, account, asset, dec(position.amount), value)
        addOpeningBalance(state, account, value)
      }
    }
    for (const unknown of opening.unknown) {
      state.notes.push(t(language, 'The holdings of {{security}} cannot be worked out from the first transaction {{type}}.', unknown))
    }
    state.notes.push(t(language, 'Holdings are known only for the securities bought or sold in the file.'))

    cleanOpeningState(state)
    return state
  }

  async unifyItem(flow: FlowPlanModel, run: RunModel, input: InputItemModel, rules: Record<string, RuleModel[]>): Promise<UnifiedItem> {
    return this.applyUnifyRules(flow, run, input, rules, input.fields.Tapahtumatyyppi as string)
  }
}
