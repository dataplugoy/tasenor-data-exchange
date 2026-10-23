describe('Network errors', () => {
  it('A request not reaching the server shows an error', () => {
    cy.login()
    cy.get('[data-cy="FlowPlan-TITO Testing"]').should('exist')

    // Cypress fails the test on an uncaught exception in the page.
    cy.intercept('GET', '/api/v1/services', { forceNetworkError: true })
    cy.get('[data-cy="Menu-Services"]').click()
    cy.get('body').should('contain', 'Network Error')
  })
})
