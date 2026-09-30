import clone from 'clone'
import prisma from '@prisma/client'
import { UploadRequired } from '../exceptions/UploadRequired'
import { t } from '../lib/i18n/t'
import { BatchModel } from '../models/BatchModel'
import { FlowPlanModel } from '../models/FlowPlanModel'
import { ManualUploadDriverSettings } from '../types/DriverSettings'
import { ManualUploadFlowState } from '../types/FlowState'
import { Language, num } from '@tasenor/common'
import { ProjectSettings } from '../types/API/Project'
import { Setup } from '../types/API/Setup'
import { InputDriver } from './InputDriver'

export type PreProcessOptions = {
  numericFields?: string[]
  numericOrNullFields?: string[]
  requiredFields?: string[]
  defaults?: Record<string, unknown>
}

/**
 * A base class for drivers that use manual upload.
 */
export class ManualUploadDriver extends InputDriver {

  declare settings: ManualUploadDriverSettings
  declare state: ManualUploadFlowState

  constructor(settings: ManualUploadDriverSettings, projectSettings: ProjectSettings, setup: Setup = {}, type: prisma.DriverType = 'MANUAL_UPLOAD') {
    super(settings, projectSettings, setup, type)
  }

  async autheticate(): Promise<ManualUploadFlowState> {
    return {}
  }

  async fetchData(flowPlan: FlowPlanModel): Promise<Buffer> {
    const batch = await BatchModel.getLatest(flowPlan)
    if (batch && batch.data.data !== null) {
      return Buffer.from(batch.data.data)
    }
    throw new UploadRequired(
      `/api/v1/flow-plans/${flowPlan.id}/upload`,
      this.options.userId,
      t(this.projectSettings.language as Language, 'Please select a statement to upload.'),
    )
  }

  /**
   * Make checks and perform conversions to the selected fields.
   * @param csv
   * @param options
   */
  preProcess(csv: { raw: string, record: Record<string, string | number | null> }[], options: PreProcessOptions): void {
    // Fill in defaults.
    options.defaults && Object.keys(options.defaults).forEach(field => {
      csv.forEach(line => {
        if (!(field in line.record) || line.record[field] === '') {
          line.record[field] = clone(options.defaults && options.defaults[field])
        }
      })
    })

    // Check for required fields.
    options.requiredFields && options.requiredFields.forEach(field => {
      csv.forEach(line => {
        if (!(field in line.record) || line.record[field] === '') {
          throw new Error(`The required field '${field}' is missing on line ${JSON.stringify(line.record)}.`)
        }
      })
    })

    // Convert to numeric fields. Value required.
    options.numericFields && options.numericFields.forEach(field => {
      csv.forEach(line => {
        if (!(field in line.record)) {
          throw new Error(`There is no field '${field}' on line ${JSON.stringify(line.record)}.`)
        }
        if (line.record[field] === '') {
          throw new Error(`The numeric field '${field}' is empty on line ${JSON.stringify(line.record)}.`)
        } else {
          line.record[field] = num(`${line.record[field]}`)
        }
      })
    })

    // Convert to numeric fields. Use null if value empty.
    options.numericOrNullFields && options.numericOrNullFields.forEach(field => {
      csv.forEach(line => {
        if (!(field in line.record)) {
          throw new Error(`There is no field '${field}' on line ${JSON.stringify(line.record)}.`)
        }
        line.record[field] = line.record[field] === '' ? null : num(`${line.record[field]}`)
      })
    })
  }
}
