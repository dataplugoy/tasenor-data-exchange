import AuthResponse from './schema/auth/AuthResponse.json'
import CreateFlowPlannResponse from './schema/flow-plans/CreateFlowPlanResponse.json'

describe('Flow Plan API', () => {
  it('POST /flow-plan', () => {
    cy.apiCall('POST', '/auth', { email: 'test@localhost', password: 'pass' }).then(() => {
      cy.apiCall('POST', '/flow-plans', {
        name: 'Test',
        input: {},
        output: {}
      }).should('validatesAs', AuthResponse)
    })
  })
})
