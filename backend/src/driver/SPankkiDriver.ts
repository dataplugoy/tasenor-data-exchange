import { BatchModel } from '../models/BatchModel'
import { InputItemData } from '../types/API/InputItem'
import { SPankkiDriverSettings } from '../types/DriverSettings'
import { NordnetFlowState } from '../types/FlowState'
import { ManualUploadDriver } from './ManualUploadDriver'
import { FlowPlanModel } from '../models/FlowPlanModel'
import { RunModel } from '../models/RunModel'
import { InputItemModel } from '../models/InputItemModel'
import { RuleModel } from '../models/RuleModel'
import { UnifiedItem } from '../types/API/UnifiedItem'
import { ProjectSettings } from '../types/API/Project'
import { Setup } from '../types/API/Setup'
import { dateFI } from '../lib/datetime'

/**
 * A driver to upload Nordnet data.
 */
export class SPankkiDriver extends ManualUploadDriver {

  declare settings: SPankkiDriverSettings
  declare state: NordnetFlowState

  constructor(settings: SPankkiDriverSettings, projectSettings: ProjectSettings, setup: Setup = {}) {
    super(settings, projectSettings, setup, 'S_PANKKI')
  }

  async itemizeInput(batch: BatchModel): Promise<InputItemData[]> {

    const csv = await batch.parseCsvColumns({
      delimiter: ';',
      raw: true,
      regexMatch: /Kirjauspäivä;Maksupäivä;Summa;Tapahtumalaji;Maksaja;Saajan nimi;Saajan tilinumero/,
      from: 2,
      bom: true,
      columns: [
        'Kirjauspäivä',
        'Maksupäivä',
        'Summa',
        'Tapahtumalaji',
        'Maksaja',
        'Saajan nimi',
        'Saajan tilinumero',
        'Saajan BIC-tunnus',
        'Viitenumero',
        'Viesti',
        'Arkistointitunnus',
      ]
    })

    this.preProcess(csv, {
      numericFields: ['Summa'],
      numericOrNullFields: [],
      requiredFields: ['Maksupäivä', 'Saajan nimi', 'Viitenumero', 'Viesti', 'Tapahtumalaji'],
    })

    return csv.map((line, index) => {
      return {
        line: index + 2,
        original: line.raw,
        time: dateFI(line.record['Maksupäivä']),
        text: line.record['Saajan nimi'],
        total: line.record.Summa,
        fields: line.record
      }
    })
  }

  async unifyItem(flow: FlowPlanModel, run: RunModel, input: InputItemModel, rules: Record<string, RuleModel[]>): Promise<UnifiedItem> {
    return this.applyUnifyRules(flow, run, input, rules, input.fields.Tapahtumalaji as string)
  }
}
