describe('Login screen', () => {
  it('Log in to the system', () => {
    cy.login()

    cy.get('body').should('contain', 'Dashboard')
    cy.get('body').should('contain', 'Projects')
    cy.get('body').should('contain', 'Rules')
    cy.get('body').should('contain', 'Logout')

    cy.get('button').contains('Logout').click()

    cy.get('body').should('not.contain', 'Dashboard')
    cy.get('body').should('not.contain', 'Projects')
    cy.get('body').should('not.contain', 'Rules')
    cy.get('body').should('not.contain', 'Logout')
    cy.get('body').should('contain', 'Login')
  })
})
