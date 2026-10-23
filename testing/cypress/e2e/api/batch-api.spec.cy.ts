import CreateFlowPlanResponse from './schema/flow-plans/CreateFlowPlanResponse.json'

describe('Batch API', () => {
  it('PUT /batches/:id/rollback', () => {
    cy.apiCall('POST', '/auth', { email: 'test@localhost', password: 'pass' }).then(() => {

      cy.apiCall('POST', '/flow-plans', {
        title: 'Rollback Testing',
        projectId: 1,
        firstDate: '1900-01-01',
        source: {
          type: 'TEST_MOCK',
          settings: {
            url: 'file:///test.csv'
          }
        },
        destination: {
          type: 'NO_ACTION',
          settings: {}
        },
        setup: {
          accountGrouping: { singleFeeAccount: false, singleLossAccount: false, singleProfitAccount: false }
        }
      }).should('validatesAs', CreateFlowPlanResponse, 201).then((created) => {
        const id = created.body.id

        cy.apiCall('GET', `/flow-plans/${id}/run`).its('status').should('equal', 200)
        cy.apiCall('GET', `/flow-plans/${id}/run`).its('status').should('equal', 200)

        cy.apiCall('GET', `/flow-plans/${id}`).then((res) => {
          const [latest, older] = res.body.batches
          expect(latest.number).to.equal(2)
          expect(older.number).to.equal(1)

          cy.apiCall('PUT', `/batches/${older.id}/rollback`).its('status').should('equal', 400)
          cy.apiCall('PUT', `/batches/${latest.id}/rollback`).its('status').should('equal', 204)
          cy.apiCall('PUT', `/batches/${older.id}/rollback`).its('status').should('equal', 204)
        })
      })
    })
  })

  it('DELETE /batches/:id', () => {
    cy.apiCall('POST', '/auth', { email: 'test@localhost', password: 'pass' }).then(() => {

      cy.apiCall('POST', '/flow-plans', {
        title: 'Abandon Testing',
        projectId: 1,
        firstDate: '1900-01-01',
        source: {
          type: 'TEST_MOCK',
          settings: {
            url: 'file:///test.csv'
          }
        },
        destination: {
          type: 'NO_ACTION',
          settings: {}
        },
        setup: {
          accountGrouping: { singleFeeAccount: false, singleLossAccount: false, singleProfitAccount: false }
        }
      }).should('validatesAs', CreateFlowPlanResponse, 201).then((created) => {
        const id = created.body.id

        cy.apiCall('GET', `/flow-plans/${id}/run`).its('status').should('equal', 200)
        cy.apiCall('GET', `/flow-plans/${id}/run`).its('status').should('equal', 200)

        cy.apiCall('GET', `/flow-plans/${id}`).then((res) => {
          const [latest, older] = res.body.batches
          expect(Object.keys(res.body.balance)).to.not.be.empty

          cy.apiCall('DELETE', `/batches/${older.id}`).its('status').should('equal', 400)
          cy.apiCall('DELETE', `/batches/${latest.id}`).its('status').should('equal', 204)
          cy.apiCall('DELETE', `/batches/${older.id}`).its('status').should('equal', 204)

          // The delivered output is rolled back with the balances.
          cy.apiCall('GET', `/flow-plans/${id}`).then((res) => {
            expect(res.body.batches).to.be.empty
            expect(res.body.balance).to.deep.equal({})
          })
        })
      })
    })
  })

  it('Skipped output duplicates do not change the stock', () => {
    cy.apiCall('POST', '/auth', { email: 'test@localhost', password: 'pass' }).then(() => {
      cy.apiCall('POST', '/flow-plans', {
        title: 'Duplicate Stock Testing',
        projectId: 1,
        firstDate: '1900-01-01',
        source: { type: 'TEST_MOCK', settings: { url: 'file:///duplicates-stock.csv' } },
        destination: { type: 'NO_ACTION', settings: {} },
        setup: {
          settings: { inputDuplicates: 'Always', outputDuplicates: 'Never' },
          accountGrouping: { singleFeeAccount: false, singleLossAccount: false, singleProfitAccount: false },
        },
      }).should('validatesAs', CreateFlowPlanResponse, 201).then((created) => {
        const id = created.body.id
        cy.apiCall('GET', `/flow-plans/${id}/run`).its('status').should('equal', 200)
        cy.apiCall('GET', `/flow-plans/${id}`).then((res) => {
          // Three identical purchases of 2 BTC, of which one is delivered, and a later transaction.
          const btc = Object.values(res.body.stock as Record<string, Record<string, { amount: number }>>)
            .map(assets => assets.BTC ? assets.BTC.amount : 0)
            .reduce((a, b) => a + b, 0)
          expect(btc).to.equal(2)
        })
      })
    })
  })
})
