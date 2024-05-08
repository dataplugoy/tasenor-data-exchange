describe('Flow Plan', () => {
  it('Log in to the system and run batches', () => {
    cy.login()

    cy.get('body').should('contain', 'Dashboard')
    cy.get('body').should('contain', 'Projects')
    cy.get('body').should('contain', 'Rules')
    cy.get('body').should('contain', 'Logout')

    cy.get('[data-cy="FlowPlan-Unit Testing"]').click()

    cy.get('body').should('contain', 'Project: Testing')
    cy.get('body').should('contain', 'Currency: EUR')
    cy.get('body').should('contain', 'Language: fi')
    cy.get('button').contains('Run').click()

    cy.get('[data-cy="Batch-#1"]').click()

    cy.get('body').should('contain', 'Processing started and data fetched')
    cy.get('body').should('contain', 'Data successfully parsed')
    cy.get('body').should('contain', 'Converted to standard format')
    cy.get('body').should('contain', 'Analysed and converted to results')
    cy.get('body').should('contain', 'Results successfully delivered')
    cy.get('[data-cy="Batch-#1"] [data-cy="output"]').should('have.text', '3')

    cy.get('button').contains('Run').click()
    cy.get('[data-cy="Batch-#2"] [data-cy="output"]').should('have.text', '1')

    cy.get('button').contains('Run').click()
    cy.get('[data-cy="Batch-#3"] [data-cy="output"]').should('have.text', '1')

    cy.get('button').contains('Run').click()
    cy.get('[data-cy="Batch-#4"] [data-cy="output"]').should('have.text', '1')

    cy.get('button').contains('Run').click()
    cy.get('[data-cy="Batch-#5"] [data-cy="output"]').should('have.text', '1')

    cy.get('button').contains('Run').click()
    cy.get('[data-cy="Batch-#6"] [data-cy="output"]').should('have.text', '')

    cy.get('button').contains('Logout').click()

    cy.get('body').should('not.contain', 'Dashboard')
    cy.get('body').should('not.contain', 'Projects')
    cy.get('body').should('not.contain', 'Rules')
    cy.get('body').should('not.contain', 'Logout')
    cy.get('body').should('contain', 'Login')
  })
})
