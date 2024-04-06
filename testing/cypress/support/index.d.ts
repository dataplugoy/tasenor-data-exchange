/// <reference types="cypress" />

export {}

declare global {
  namespace Cypress {
    interface Chainable {
      login(): Chainable<void>
    }
  }
}
