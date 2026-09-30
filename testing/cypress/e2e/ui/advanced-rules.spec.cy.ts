describe('Rules as JSON', () => {
  it('Rules can be edited and saved in the JSON editor', () => {
    cy.apiCall('POST', '/auth', { email: 'test@localhost', password: 'pass' }).then(() => {
      cy.apiCall('GET', '/flow-plans').then((res) => {
        const plan = res.body.find((plan: { title: string }) => plan.title === 'Coinbase Testing')
        const url = `/flow-plans/${plan.id}/rules`

        cy.apiCall('POST', url, {
          name: 'JSON test',
          kind: 'MAPPING',
          filterView: { conditions: [{ field: 'Kind', operator: 'equals', value: 'Reward' }] },
          resultView: { action: 'skip' },
        }).then((res) => {
          expect(res.status).to.eq(200)

          cy.login()
          cy.get('[data-cy="FlowPlan-Coinbase Testing"]').click()
          cy.get('[data-cy="Menu-Rules"]').click()
          cy.get('button').contains('Advanced (JSON)').click()
          cy.get('body').should('contain', 'Edit Rules as JSON')
          cy.get('body').should('contain', 'JSON test')

          // Edit the name of the rule in the editor.
          cy.contains('.jer-value-string', 'JSON test').dblclick()
          cy.get('textarea.jer-input-text').clear().type('JSON edited{enter}')
          cy.get('body').should('contain', 'Edit Rules as JSON *')

          cy.get('button').contains('Save').click()
          cy.get('body').should('contain', 'Rules saved succssfully.')

          cy.apiCall('GET', url).then((res) => {
            expect(res.body.map((r: { name: string }) => r.name)).to.include('JSON edited')
          })
        })
      })
    })
  })
})
