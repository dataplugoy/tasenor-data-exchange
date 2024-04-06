/// <reference types="cypress" />
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
