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

    const version = await batch.detectVersion([
      /^\s*Id\s+Kirjauspäivä\s+Kauppapäivä\s+Maksupäivä\s+Salkku\s+Tapahtumatyyppi\s+Arvopaperi\s+ISIN\s+Määrä\s+Kurssi\s+Korko\s+Kokonaiskulut\s+Valuutta\s+Summa\s+Valuutta\s+Hankinta-arvo\s+Valuutta\s+Tulos\s+Valuutta\s+Kokonaismäärä\s+Saldo\s+Vaihtokurssi\s+Tapahtumateksti\s+Mitätöintipäivä\s+Laskelma\s+Vahvistusnumero\s+Välityspalkkio\s+Valuutta\s+Viitevaluuttakurssi/,
      /^\s*Id\s+Kirjauspäivä\s+Kauppapäivä\s+Maksupäivä\s+Salkku\s+Tapahtumatyyppi\s+Arvopaperi\s+Instrumenttityyppi\s+ISIN\s+Määrä\s+Kurssi\s+Korko\s+Kokonaiskulut\s+Valuutta\s+Summa\s+Valuutta\s+Hankinta-arvo\s+Valuutta\s+Tulos\s+Valuutta\s+Kokonaismäärä\s+Saldo\s+Vaihtokurssi\s+Tapahtumateksti\s+Mitätöintipäivä\s+Laskelma\s+Vahvistusnumero\s+Välityspalkkio\s+Valuutta/,
    ])

    if (version === null) {
      throw new Error('Unable to determine file format version. Maybe this is not a Nordnet statement?')
    }

    this.version = version

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

  async itemizeInputVersion2(batch: BatchModel): Promise<InputItemData[]> {

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
      ]
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

  async unifyItem(flow: FlowPlanModel, run: RunModel, input: InputItemModel, rules: Record<string, RuleModel[]>): Promise<UnifiedItem> {
    return this.applyUnifyRules(flow, run, input, rules, input.fields.Tapahtumatyyppi as string)
  }
}
