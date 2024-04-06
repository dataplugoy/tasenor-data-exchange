/// <reference types="cypress" />

export {}

declare global {
  namespace Cypress {
    interface Chainable {
      login(): Chainable<void>
      apiCall(method: string, url: string, data: Record<string, any>): Chainable<Cypress.Response<any>>
    }
  }
}

/*
  Also this could be good option once we have full specification in place:

  https://www.chaijs.com/plugins/chai-openapi-response-validator/
*/

namespace Cypress {
  interface Chainer<Subject> {
    (chainer: 'validatesAs', json: Record<string, any>): Chainable<Subject>,
  }
}
