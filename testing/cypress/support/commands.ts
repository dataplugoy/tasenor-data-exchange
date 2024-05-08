/// <reference types="cypress" />
import { ajv } from '../../../backend/src/lib/validate'

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

  if (!ajv.validate(json, res.body)) {
    const errors = JSON.stringify(ajv.errors)
    throw new Error(`Response ${JSON.stringify(res.body)} failed validation: ${errors}`)
  }
})
