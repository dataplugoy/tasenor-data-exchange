/// <reference types="cypress" />
import Ajv from 'ajv'
import Account from '../e2e/api/schema/Account.json'
import Alert from '../e2e/api/schema/Alert.json'
import AlertMethod from '../e2e/api/schema/AlertMethod.json'
import AlertType from '../e2e/api/schema/AlertType.json'
import Asset from '../e2e/api/schema/Asset.json'
import BalanceData from '../e2e/api/schema/BalanceData.json'
import Batch from '../e2e/api/schema/Batch.json'
import DriverType from '../e2e/api/schema/DriverType.json'
import FileUpload from '../e2e/api/schema/FileUpload.json'
import FlowPlan from '../e2e/api/schema/FlowPlan.json'
import InputItemData from '../e2e/api/schema/InputItemData.json'
import InputItem from '../e2e/api/schema/InputItem.json'
import ItemError from '../e2e/api/schema/ItemError.json'
import OutputItem from '../e2e/api/schema/OutputItem.json'
import Project from '../e2e/api/schema/Project.json'
import ProjectSettings from '../e2e/api/schema/ProjectSettings.json'
import Rates from '../e2e/api/schema/Rates.json'
import RemoteAccount from '../e2e/api/schema/RemoteAccount.json'
import Run from '../e2e/api/schema/Run.json'
import RunResult from '../e2e/api/schema/RunResult.json'
import Setup from '../e2e/api/schema/Setup.json'
import SkipReason from '../e2e/api/schema/SkipReason.json'
import StockData from '../e2e/api/schema/StockData.json'
import TransactionExtras from '../e2e/api/schema/TransactionExtras.json'
import Transaction from '../e2e/api/schema/Transaction.json'
import TransactionLine from '../e2e/api/schema/TransactionLine.json'
import UnifiedItemData from '../e2e/api/schema/UnifiedItemData.json'
import UnifiedItem from '../e2e/api/schema/UnifiedItem.json'
import UnifiedItemType from '../e2e/api/schema/UnifiedItemType.json'


/**
 * Log in as normal user.
 */
Cypress.Commands.add('login', () => {

  cy.fixture('fixtures.json').then((config) => {
    cy.visit('/')

    cy.get('input[name="email"]').type(config.user)
    cy.get('input[name="password"]').type(config.password)
    cy.get('button').contains('Login').click()
  })

})

/**
 * Make a HTTP request to API.
 */
let token: string | undefined
Cypress.Commands.add('apiCall', (method: string, url: string, body: Record<string, any> = {}) => {
  const baseUrl = new URL(Cypress.env('CYPRESS_URL'))
  const apiUrl = `${baseUrl.protocol}//${baseUrl.hostname}:${parseInt(baseUrl.port) + 1}/api/v1`
  const headers: Record<string, string> = {}
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return cy.request({
    failOnStatusCode: false,
    method,
    url: `${apiUrl}${url}`,
    body,
    headers
  }).then(res => {
    if (res.body && res.body.token) {
      token = res.body.token
    }
    return res
  })
})

/**
 * Validate a response against the JSON schema.
 */
chai.Assertion.addChainableMethod('validatesAs', function(json: Record<string, any>, status = 200) {
  const res = this._obj
  expect(res.status).to.eq(status)

  const ajv = new Ajv()

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
  ajv.addSchema(ItemError)
  ajv.addSchema(OutputItem)
  ajv.addSchema(Project)
  ajv.addSchema(ProjectSettings)
  ajv.addSchema(Rates)
  ajv.addSchema(RemoteAccount)
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

  if (!ajv.validate(json, res.body)) {
    const errors = JSON.stringify(ajv.errors)
    throw new Error(`Response ${JSON.stringify(res.body)} failed validation: ${errors}`)
  }
})
