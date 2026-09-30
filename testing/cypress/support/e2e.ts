// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

import './commands'

// Every spec starts from the test database snapshot, so that specs do not depend on each other or their order.
before(() => {
  cy.task('loadDatabase', null, { timeout: 120000 })
})
