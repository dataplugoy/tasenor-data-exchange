/// <reference types="cypress" />
import Ajv from 'ajv'
import { AssertionError } from 'chai'

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
Cypress.Commands.add('apiCall', (method: string, url: string, body: Record<string, any>) => {
  const baseUrl = new URL(Cypress.env('CYPRESS_URL'))
  const apiUrl = `${baseUrl.protocol}//${baseUrl.hostname}:${parseInt(baseUrl.port) + 1}/api/v1`

  return cy.request({
    failOnStatusCode: false,
    method,
    url: `${apiUrl}/auth`,
    body
  })
})

/**
 * Validate a response against the JSON schema.
 */
chai.Assertion.addChainableMethod('validatesAs', function(json: Record<string, any>) {
  const res = this._obj
  expect(res.status).to.eq(200)

  const ajv = new Ajv()

  if (!ajv.validate(json, res.body)) {
    const errors = JSON.stringify(ajv.errors)
    throw new Error(`Response ${JSON.stringify(res.body)} failed validation: ${errors}`)
  }
})
