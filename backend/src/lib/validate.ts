import Ajv from 'ajv'
import Account from '../../src/types/API/Account.json'
import Alert from '../../src/types/API/Alert.json'
import AlertMethod from '../../src/types/API/AlertMethod.json'
import AlertType from '../../src/types/API/AlertType.json'
import Asset from '../../src/types/API/Asset.json'
import BalanceData from '../../src/types/API/BalanceData.json'
import Batch from '../../src/types/API/Batch.json'
import DriverType from '../../src/types/API/DriverType.json'
import FileUpload from '../../src/types/API/FileUpload.json'
import FlowPlan from '../../src/types/API/FlowPlan.json'
import InputItemData from '../../src/types/API/InputItemData.json'
import InputItem from '../../src/types/API/InputItem.json'
import OutputItem from '../../src/types/API/OutputItem.json'
import Project from '../../src/types/API/Project.json'
import ProjectSettings from '../../src/types/API/ProjectSettings.json'
import Rates from '../../src/types/API/Rates.json'
import Run from '../../src/types/API/Run.json'
import RunResult from '../../src/types/API/RunResult.json'
import Setup from '../../src/types/API/Setup.json'
import SkipReason from '../../src/types/API/SkipReason.json'
import StockData from '../../src/types/API/StockData.json'
import TransactionExtras from '../../src/types/API/TransactionExtras.json'
import Transaction from '../../src/types/API/Transaction.json'
import TransactionLine from '../../src/types/API/TransactionLine.json'
import UnifiedItemData from '../../src/types/API/UnifiedItemData.json'
import UnifiedItem from '../../src/types/API/UnifiedItem.json'
import UnifiedItemType from '../../src/types/API/UnifiedItemType.json'
import { error } from '@tasenor/common'

export const ajv = new Ajv()
ajv.addSchema(Account)
ajv.addSchema(Alert)
ajv.addSchema(AlertMethod)
ajv.addSchema(AlertType)
ajv.addSchema(Asset)
ajv.addSchema(BalanceData)
ajv.addSchema(Batch)
ajv.addSchema(DriverType)
ajv.addSchema(FileUpload)
ajv.addSchema(FlowPlan)
ajv.addSchema(InputItemData)
ajv.addSchema(InputItem)
ajv.addSchema(OutputItem)
ajv.addSchema(Project)
ajv.addSchema(ProjectSettings)
ajv.addSchema(Rates)
ajv.addSchema(Run)
ajv.addSchema(RunResult)
ajv.addSchema(Setup)
ajv.addSchema(SkipReason)
ajv.addSchema(StockData)
ajv.addSchema(TransactionExtras)
ajv.addSchema(Transaction)
ajv.addSchema(TransactionLine)
ajv.addSchema(UnifiedItemData)
ajv.addSchema(UnifiedItem)
ajv.addSchema(UnifiedItemType)

export const validate = (schema) => {
  return (req, res, next) => {
    if (!ajv.validate(schema, req.body)) {
      error(`Validation failed: ${JSON.stringify(ajv.errors)}`)
      res.status(400).send({
        message: 'Invalid request parameters.'
      })
    } else {
      next()
    }
  }
}
