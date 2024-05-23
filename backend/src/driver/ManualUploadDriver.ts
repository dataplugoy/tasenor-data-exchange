import prisma from '@prisma/client'
import { UploadRequired } from '../exceptions/UploadRequired'
import { _ } from '../lib/i18n/t'
import { BatchModel } from '../models/BatchModel'
import { FlowPlanModel } from '../models/FlowPlanModel'
import { ManualUploadDriverSettings } from '../types/DriverSettings'
import { ManualUploadFlowState } from '../types/FlowState'
import { Driver } from './Driver'
import { num } from '@tasenor/common'
import { ProjectSettings } from '../types/API/Project'
import { Setup } from '../types/API/Setup'
import { AnswersRequired } from '../exceptions/AnswersRequired'

export type PreProcessOptions = {
  numericFields?: string[]
  numericOrNullFields?: string[]
  requiredFields?: string[]
}

/**
 * A base class for drivers that use manual upload.
 */
export class ManualUploadDriver extends Driver {

  declare settings: ManualUploadDriverSettings
  declare state: ManualUploadFlowState

  constructor(settings: ManualUploadDriverSettings, projectSettings: ProjectSettings, setup: Setup = {}, type: prisma.DriverType = 'MANUAL_UPLOAD') {
    super(settings, projectSettings, setup, type)
  }

  canHandleInput(): boolean {
    return true
  }

  async autheticate(): Promise<ManualUploadFlowState> {
    return {}
  }

  async fetchData(flowPlan: FlowPlanModel): Promise<Buffer> {
    const batch = await BatchModel.getLatest(flowPlan)
    if (batch && batch.data.data !== null) {
      return batch.data.data
    }
    throw new UploadRequired(
      `/api/v1/flow-plans/${flowPlan.id}/continue`,
      this.options.userId,
      _('Please select a statement to upload.'),
    )
  }

  /**
   * Make checks and perform conversions to the selected fields.
   * @param csv
   * @param options
   */
  preProcess(csv: { raw: string, record: Record<string, string | number | null>}[], options: PreProcessOptions): void {
    // Convert to numeric fields. Value required.
    options.numericFields && options.numericFields.forEach(field => {
      csv.forEach(line => {
        if (!(field in line.record)) {
          throw new Error(`There is no field '${field}' on line ${JSON.stringify(line.record)}.`)
        }
        if (line.record[field] === '') {
          throw new Error(`A field '${field}' is empty in line ${JSON.stringify(line.record)} (maybe you want to use 'numericOrNullFields' instead).`)
        }
        line.record[field] = num(`${line.record[field]}`)
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

    // Check for required fields.
    options.requiredFields && options.requiredFields.forEach(field => {
      csv.forEach(line => {
        if (!(field in line.record) || line.record[field] === '') {
          throw new Error(`The required field '${field}' is missing on line ${JSON.stringify(line.record)}.`)
        }
      })
    })
  }
}
