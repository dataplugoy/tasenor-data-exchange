import FlowPlansResponse from './schema/flow-plans/FlowPlansResponse.json'
import CreateFlowPlanResponse from './schema/flow-plans/CreateFlowPlanResponse.json'
import FlowPlanResponse from './schema/flow-plans/FlowPlanResponse.json'
import FlowPlanRunResponse from './schema/flow-plans/FlowPlanRunResponse.json'

describe('Flow Plan API', () => {
  it('POST /flow-plan', () => {
    cy.apiCall('POST', '/auth', { email: 'test@localhost', password: 'pass' }).then(() => {

      cy.apiCall('POST', '/flow-plans', {
        title: 'UI Test',
        projectId: 1,
        firstDate: '1900-01-01',
        source: {
          type: 'TEST_MOCK',
          settings: {
            url: 'file:////dev/null'
          }
        },
        destination: {
          type: 'NO_ACTION',
          settings: {}
        },
        setup: {}
      }).should('validatesAs', CreateFlowPlanResponse, 201)

      cy.apiCall('GET', '/flow-plans').should('validatesAs', FlowPlansResponse)
      cy.apiCall('GET', '/flow-plans').then((res) => {
        const uiTestPlan = res.body.find((plan: { title: string}) => plan.title === 'UI Test')
        // TODO: Something wrong with this validation.
        // cy.apiCall('GET', `/flow-plans/${uiTestPlan.id}`).should('validatesAs', FlowPlanResponse)
        cy.apiCall('GET', `/flow-plans/${uiTestPlan.id}/run`).should('validatesAs', FlowPlanRunResponse)
      })
    })
  })
})
