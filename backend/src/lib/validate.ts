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
import InputSource from '../../src/types/API/InputSource.json'
import InputSourceSettings from '../../src/types/API/InputSourceSettings.json'
import ItemError from '../../src/types/API/ItemError.json'
import Notes from '../../src/types/API/Notes.json'
import OutputDestination from '../../src/types/API/OutputDestination.json'
import OutputDestinationSettings from '../../src/types/API/OutputDestinationSettings.json'
import OutputItem from '../../src/types/API/OutputItem.json'
import Project from '../../src/types/API/Project.json'
import ProjectSettings from '../../src/types/API/ProjectSettings.json'
import QuestionArgs from '../../src/types/API/QuestionArgs.json'
import Question from '../../src/types/API/Question.json'
import QuestionType from '../../src/types/API/QuestionType.json'
import Rates from '../../src/types/API/Rates.json'
import RemoteAccount from '../../src/types/API/RemoteAccount.json'
import RemoteId from '../../src/types/API/RemoteId.json'
import Rule from '../../src/types/API/Rule.json'
import Run from '../../src/types/API/Run.json'
import RunResult from '../../src/types/API/RunResult.json'
import Settings from '../../src/types/API/Settings.json'
import Setup from '../../src/types/API/Setup.json'
import SkipReason from '../../src/types/API/SkipReason.json'
import StockData from '../../src/types/API/StockData.json'
import TransactionExtras from '../../src/types/API/TransactionExtras.json'
import Transaction from '../../src/types/API/Transaction.json'
import TransactionLine from '../../src/types/API/TransactionLine.json'
import UnifiedItem from '../../src/types/API/UnifiedItem.json'
import UnifiedItemData from '../../src/types/API/UnifiedItemData.json'
import UnifiedItemRule from '../../src/types/API/UnifiedItemRule.json'
import UnifiedItemType from '../../src/types/API/UnifiedItemType.json'
import UserSettings from '../../src/types/API/UserSettings.json'
import { error } from '@tasenor/common'

export const ajv = new Ajv({ allowUnionTypes: true })

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
ajv.addSchema(InputSource)
ajv.addSchema(InputSourceSettings)
ajv.addSchema(ItemError)
ajv.addSchema(Notes)
ajv.addSchema(OutputDestination)
ajv.addSchema(OutputDestinationSettings)
ajv.addSchema(OutputItem)
ajv.addSchema(Project)
ajv.addSchema(ProjectSettings)
ajv.addSchema(QuestionArgs)
ajv.addSchema(Question)
ajv.addSchema(QuestionType)
ajv.addSchema(Rates)
ajv.addSchema(RemoteAccount)
ajv.addSchema(RemoteId)
ajv.addSchema(Rule)
ajv.addSchema(Run)
ajv.addSchema(RunResult)
ajv.addSchema(Settings)
ajv.addSchema(Setup)
ajv.addSchema(SkipReason)
ajv.addSchema(StockData)
ajv.addSchema(TransactionExtras)
ajv.addSchema(Transaction)
ajv.addSchema(TransactionLine)
ajv.addSchema(UnifiedItemData)
ajv.addSchema(UnifiedItem)
ajv.addSchema(UnifiedItemRule)
ajv.addSchema(UnifiedItemType)
ajv.addSchema(UserSettings)

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
