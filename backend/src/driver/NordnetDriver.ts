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

/**
 * A base class for drivers that use manual upload.
 */
export class NordnetDriver extends ManualUploadDriver {

  declare settings: NordnetDriverSettings
  declare state: NordnetFlowState

  constructor(settings: NordnetDriverSettings) {
    super(settings, 'NORDNET')
  }

  async itemizeInput(batch: BatchModel): Promise<InputItemData[]> {

    const csv = await batch.parseCsvColumns({
      delimiter: '\t',
      raw: true,
      regexMatch: /^\s*Id\tKirjausp.iv.\sKauppap.iv.\sMaksup.iv./,
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
      requiredFields: ['Tapahtumatyyppi', 'Summa'],
    })

    return csv.map((line, index) => ({
      line: index + 2,
      original: line.raw,
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

/*
   TODO: Handle the remaining cases.

  "rules": [
    {
      "name": "Forex Sell",
      "filter": "Tapahtumatyyppi == 'VALUUTAN MYYNTI'",
      "result": [
        {
          "data": {
            "text": "Tapahtumateksti",
            "rates": "rates(Valuutta, Vaihtokurssi)"
          },
          "type": "'currency'",
          "asset": "Valuutta",
          "amount": "Summa",
          "reason": "'forex'"
        }
      ]
    },
    {
      "name": "Forex Buy",
      "filter": "Tapahtumatyyppi == 'VALUUTAN OSTO'",
      "result": [
        {
          "data": {
            "text": "Tapahtumateksti"
          },
          "type": "'currency'",
          "asset": "Valuutta",
          "amount": "Summa",
          "reason": "'forex'"
        }
      ]
    },
    {
      "name": "Withholding Tax",
      "filter": "Tapahtumatyyppi == 'ENNAKKOPIDÄTYS'",
      "result": [
        {
          "data": {
            "text": "Tapahtumateksti",
            "currency": "Valuutta",
            "currencyValue": "-Summa * 100"
          },
          "type": "'statement'",
          "asset": "'WITHHOLDING_TAX'",
          "reason": "'tax'"
        }
      ]
    },
  ]
}
*/
