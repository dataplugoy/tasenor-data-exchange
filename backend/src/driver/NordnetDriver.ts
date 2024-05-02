import { DateTime } from 'luxon'
import { BatchModel } from '../models/BatchModel'
import { InputItemData } from '../types/API/InputItem'
import { NordnetDriverSettings } from '../types/DriverSettings'
import { NordnetFlowState } from '../types/FlowState'
import { ManualUploadDriver } from './ManualUploadDriver'

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

    const csv = batch.parseCsvColumns({
      delimiter: '\t',
      raw: true,
      regexMatch: /^\s*Id\tKirjausp.iv.\sKauppap.iv.\sMaksup.iv./
    })

    this.preProcess(csv, {
      numericFields: ['Summa', 'Kurssi', 'Määrä', 'Kokonaiskulut', 'Kokonaismäärä', 'Hankinta-arvo', 'Saldo', 'Vaihtokurssi'],
      numericOrNullFields: ['Välityspalkkio'],
    })

    return csv.map((line, index) => ({
        line: index + 2,
        original: line.raw,
        time: DateTime.fromISO(`${line.record['Kirjauspäivä']}T12:00:00Z`).toUTC().toISO() as string,
        text: line.record['Tapahtumateksti'] || line.record['Tapahtumatyyppi'],
        total: line.record['Summa'],
        fields: line.record
      })
    )
  }
}
