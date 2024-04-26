import CreateFlowPlannResponse from './schema/flow-plans/CreateFlowPlanResponse.json'

describe('Flow Plan API', () => {
  it('POST /flow-plan', () => {
    cy.apiCall('POST', '/auth', { email: 'test@localhost', password: 'pass' }).then(() => {
      cy.apiCall('POST', '/flow-plans', {
        title: 'UI Test',
        projectId: 1,
        input: {
          type: 'TEST_MOCK',
          settings: {
            url: 'file:////dev/null'
          }
        },
        output: {
          type: 'NO_ACTION',
          settings: {}
        }
      }).should('validatesAs', CreateFlowPlannResponse)
    })
  })
})
