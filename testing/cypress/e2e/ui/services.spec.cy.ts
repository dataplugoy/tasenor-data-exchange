describe('Services', () => {
  it('Services can be added, tested, edited and deleted', () => {
    cy.login()
    cy.get('[data-cy="Menu-Services"]').click()
    cy.get('[data-cy="Service-Test Files"]').should('exist')

    // Add a service.
    cy.get('[data-cy="AddService"]').click()
    cy.get('[data-cy="SaveService"]').should('be.disabled')
    cy.get('[data-cy="ServiceName"] input').type('Bookkeeper Rates')
    cy.get('[data-cy="ServiceUrl"] input').should('have.value', 'https://bookkeeper-api.tasenor.com')
    cy.get('[data-cy="ServiceUser"] input').type('rates@localhost')
    cy.get('[data-cy="ServicePassword"] input').type('secret')
    cy.get('[data-cy="SaveService"]').click()
    cy.get('[data-cy="Service-Bookkeeper Rates"]').should('contain', 'rates@localhost').and('contain', 'Currency rates')

    // Password is not shown when editing and is kept when left empty.
    cy.get('[data-cy="Service-Bookkeeper Rates"] [data-cy="EditService"]').click()
    cy.get('[data-cy="ServicePassword"] input').should('have.value', '').and('have.attr', 'placeholder', 'Saved, leave empty to keep')
    cy.get('[data-cy="ServiceName"] input').clear().type('Rates')
    cy.get('[data-cy="SaveService"]').click()
    cy.get('[data-cy="Service-Rates"]').should('exist')

    // Test shows the result of each capability.
    cy.get('[data-cy="Service-Test Files"] [data-cy="TestService"]').click()
    cy.get('[data-cy="ServiceTest-CURRENCY_RATES"]').should('contain', 'USD in EUR')
    cy.get('[data-cy="ServiceTest-CRYPTO_RATES"]').should('contain', 'BTC in EUR')

    // Delete.
    cy.get('[data-cy="Service-Rates"] [data-cy="DeleteService"]').click()
    cy.get('[data-cy="DialogButton-OK"]').click()
    cy.get('[data-cy="Service-Rates"]').should('not.exist')
  })
})
